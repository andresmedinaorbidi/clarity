# backend/agents/router_agent.py
"""
Intent-Driven Router Agent

This router analyzes user messages to determine intent and invoke the appropriate skill.
It supports both direct skill invocation and linear progression through the build flow.
Includes automatic URL detection for the Research Agent.
"""

import json
import traceback
from utils import get_filled_prompt, ask_gemini, stream_gemini, log_agent_action, summarize_project_context
from state_schema import WebsiteState, AgentReasoning
from services import mock_hubspot_fetcher
from agents.registry import get_registry
from utils_scraper import extract_url_from_text
from helpers.field_updater import update_state_from_router_updates
from helpers.chat_response_generator import get_chat_response_data
from helpers.step_transitions import get_next_step, can_proceed_from_step
from constants import StepName, STATE_UPDATE_MARKER, get_gate_name_for_step, GATE_ACTION_PATTERN


def _execute_skill(state: WebsiteState, skill_id: str, feedback: str = None, registry=None):
    """
    Execute a single skill and yield its output.
    Updates state.current_step to reflect the active skill.

    Args:
        state: Current WebsiteState
        skill_id: ID of the skill to execute
        feedback: Optional feedback for revision mode
        registry: SkillRegistry instance

    Yields:
        Chunks of text from the skill execution
    """
    if registry is None:
        registry = get_registry()

    skill = registry.get(skill_id)
    if not skill:
        print(f"[!] Skill not found: {skill_id}")
        yield f"[Error: Skill '{skill_id}' not found]"
        return

    # Update current step to this skill
    old_step = state.current_step
    state.current_step = skill_id
    state.logs.append(f"System: Executing {skill.name} skill.")

    print(f"[SKILL] Executing: {skill.id} ({skill.name})")

    # Emit skill start indicator
    yield f"{skill.icon} **{skill.name}**\n\n"

    # Execute the skill
    try:
        for chunk in skill.execute(state, feedback=feedback):
            yield chunk

        # Log success
        state.logs.append(f"System: {skill.name} completed successfully.")
        print(f"[SKILL] Completed: {skill.id}")

    except Exception as e:
        error_msg = f"Skill execution error ({skill.id}): {str(e)}"
        print(f"[!] {error_msg}")
        state.logs.append(f"Error: {error_msg}")
        yield f"\n[Error during {skill.name}: {str(e)}]"


def _execute_skill_chain(state: WebsiteState, start_skill_id: str, registry=None):
    """
    Execute a chain of auto-executing skills starting from the given skill.
    Stops at skills that require approval (gates).

    Args:
        state: Current WebsiteState
        start_skill_id: ID of the first skill in the chain
        registry: SkillRegistry instance

    Yields:
        Chunks of text from all skills in the chain
    """
    # #region agent log
    try:
        import json
        from datetime import datetime
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Chain started", "data": {"start_skill_id": start_skill_id, "current_step": state.current_step}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
    except: pass
    # #endregion
    
    if registry is None:
        registry = get_registry()

    current_skill_id = start_skill_id

    while current_skill_id:
        skill = registry.get(current_skill_id)
        if not skill:
            # #region agent log
            try:
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Skill not found, breaking chain", "data": {"current_skill_id": current_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            break

        # #region agent log
        try:
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Executing skill", "data": {"skill_id": current_skill_id, "skill_name": skill.name, "requires_approval": skill.requires_approval, "auto_execute": skill.auto_execute, "suggested_next": skill.suggested_next}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion

        # Execute this skill
        try:
            yield from _execute_skill(state, current_skill_id, registry=registry)
            # #region agent log
            try:
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Skill execution completed", "data": {"skill_id": current_skill_id, "has_generated_code": bool(state.generated_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
        except Exception as e:
            # #region agent log
            try:
                import traceback
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Skill execution error", "data": {"skill_id": current_skill_id, "error": str(e), "traceback": traceback.format_exc()}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            raise

        # Check if this skill requires approval (is a gate)
        if skill.requires_approval:
            print(f"[CHAIN] Paused at gate: {skill.id}")
            # #region agent log
            try:
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Chain paused at gate", "data": {"skill_id": skill.id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            # Emit gate action marker for frontend approval card
            gate_name = get_gate_name_for_step(skill.id, skill.name)
            yield f"\n\n[GATE_ACTION: {gate_name}]\n"
            break

        # Get the next skill in the chain
        next_skill_id = skill.suggested_next
        if next_skill_id:
            next_skill = registry.get(next_skill_id)
            if next_skill and next_skill.auto_execute:
                print(f"[CHAIN] Auto-continuing to: {next_skill_id}")
                # #region agent log
                try:
                    with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                        f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Auto-continuing to next skill", "data": {"from": current_skill_id, "to": next_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
                except: pass
                # #endregion
                current_skill_id = next_skill_id
            else:
                # #region agent log
                try:
                    with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                        f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Chain stopped - next skill not auto-execute", "data": {"current": current_skill_id, "next": next_skill_id, "next_auto_execute": next_skill.auto_execute if next_skill else None}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
                except: pass
                # #endregion
                break
        else:
            # #region agent log
            try:
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_skill_chain", "message": "Chain stopped - no suggested_next", "data": {"current_skill_id": current_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            break


def _execute_intent(state: WebsiteState, decision: dict, user_message: str, registry=None):
    """
    Execute the appropriate action based on the Router's intent analysis.

    This is the core intent-driven execution engine.

    Args:
        state: Current WebsiteState
        decision: Parsed JSON decision from Router AI
        user_message: Original user message
        registry: SkillRegistry instance

    Yields:
        Chunks of text from skill execution
    """
    if registry is None:
        registry = get_registry()

    action = decision.get("action", "CHAT")
    requested_skill = decision.get("requested_skill", "none")
    natural_next_step = decision.get("natural_next_step")
    revision_feedback = decision.get("revision_feedback", user_message)

    print(f"[INTENT] Action: {action}, Skill: {requested_skill}, Next: {natural_next_step}")

    # -------------------------------------------------------------------------
    # ACTION: INVOKE - Direct skill invocation by user intent
    # -------------------------------------------------------------------------
    if action == "INVOKE" and requested_skill != "none":
        skill = registry.get(requested_skill)

        if skill and skill.can_invoke_directly:
            # Check prerequisites (warn but don't block)
            missing_prereqs = registry.check_prerequisites(requested_skill, state)
            if missing_prereqs:
                prereq_names = [registry.get(p).name for p in missing_prereqs if registry.get(p)]
                print(f"[INTENT] Warning: Missing prerequisites for {requested_skill}: {missing_prereqs}")
                state.logs.append(f"Note: Invoking {skill.name} without completing: {', '.join(prereq_names)}")

            # Execute the skill with revision feedback if provided
            yield from _execute_skill(state, requested_skill, feedback=revision_feedback, registry=registry)

            # Emit gate marker if skill requires approval
            if skill.requires_approval:
                gate_name = get_gate_name_for_step(skill.id, skill.name)
                yield f"\n\n[GATE_ACTION: {gate_name}]\n"

            # Log the reasoning
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User intent detected: Invoke {skill.name}. {decision.get('reasoning', '')}",
                certainty=decision.get("certainty", 0.85)
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append(f"System: Cannot directly invoke skill '{requested_skill}'")
            print(f"[!] Skill cannot be invoked directly: {requested_skill}")

    # -------------------------------------------------------------------------
    # ACTION: REVISE - Modify existing work for a skill
    # -------------------------------------------------------------------------
    elif action == "REVISE":
        # Use requested_skill if specified, otherwise revise current step
        target_skill_id = requested_skill if requested_skill != "none" else state.current_step
        skill = registry.get(target_skill_id)

        if skill and skill.revision_supported:
            print(f"[INTENT] Revising: {target_skill_id}")

            yield from _execute_skill(state, target_skill_id, feedback=revision_feedback, registry=registry)

            # Emit gate marker if skill requires approval
            if skill.requires_approval:
                gate_name = get_gate_name_for_step(skill.id, skill.name)
                yield f"\n\n[GATE_ACTION: {gate_name}]\n"

            # Log the revision
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User requested revision of {skill.name}. Feedback: {revision_feedback[:100]}...",
                certainty=decision.get("certainty", 0.85)
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append(f"System: Revision not supported for '{target_skill_id}'")
            print(f"[!] Revision not supported: {target_skill_id}")

    # -------------------------------------------------------------------------
    # ACTION: PROCEED - Move to next step in the flow
    # -------------------------------------------------------------------------
    elif action == "PROCEED":
        # #region agent log
        try:
            import json
            from datetime import datetime
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_intent", "message": "PROCEED action detected", "data": {"current_step": state.current_step, "user_message": user_message}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion
        
        # Check if we can proceed from current step
        if not can_proceed_from_step(state.current_step, state):
            print(f"[INTENT] Cannot proceed from {state.current_step}: missing required information")
            state.logs.append("System: Cannot proceed - still missing required information.")
            return
        
        # Determine next step using transition utility
        target_step = get_next_step(
            current_step=state.current_step,
            action=action,
            registry=registry,
            natural_next_step=natural_next_step
        )

        # #region agent log
        try:
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_intent", "message": "PROCEED target determined", "data": {"current_step": state.current_step, "target_step": target_step}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion

        if target_step:
            print(f"[INTENT] Proceeding to: {target_step}")

            # Execute the skill chain starting from target
            yield from _execute_skill_chain(state, target_step, registry=registry)
            
            # #region agent log
            try:
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:_execute_intent", "message": "Skill chain execution completed", "data": {"target_step": target_step, "final_step": state.current_step, "has_generated_code": bool(state.generated_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion

            # Log progression
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User approved progression. Moving from {state.current_step} to {target_step} phase.",
                certainty=decision.get("certainty", 0.90)
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append("System: Already at final step or no next step available.")
            print("[INTENT] No next step available")


def run_router_agent(state: WebsiteState, user_message: str):
    """
    Main router entry point - Intent-Driven Architecture.

    Analyzes user messages to determine intent and routes to appropriate skills.
    Supports: direct invocation, linear progression, revision, and chat.

    Args:
        state: Current WebsiteState
        user_message: User's chat message

    Yields:
        Chunks of text for streaming response
    """
    print(f"\n[ROUTER] Starting... Message: {user_message[:50]}...")
    yield " "  # Immediate pulse to browser

    try:
        registry = get_registry()

        # --- PHASE 1: PREPARE PROMPT ---
        state_dict = state.model_dump()
        state_dict['user_message'] = user_message

        # Add state indicators for the prompt
        state_dict['has_research'] = "Yes" if state.additional_context.get("research_data") else "No"
        state_dict['has_brief'] = "Yes" if state.project_brief else "No"
        state_dict['has_sitemap'] = "Yes" if state.sitemap else "No"
        state_dict['has_seo'] = "Yes" if state.seo_data else "No"
        state_dict['has_copy'] = "Yes" if state.copywriting else "No"
        state_dict['has_prd'] = "Yes" if state.prd_document else "No"

        # Add skill descriptions for intent matching
        state_dict['skill_descriptions'] = registry.get_skill_descriptions_for_prompt()

        print(f"[ROUTER] Loading prompt with skill descriptions")
        filled_prompt = get_filled_prompt("router_agent", state_dict)

        # --- PHASE 2: AI INTENT ANALYSIS ---
        print(f"[ROUTER] Calling Gemini for intent analysis...")
        extraction_raw = ask_gemini(filled_prompt, json_mode=True)

        # Clean JSON response
        clean_json = extraction_raw.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        clean_json = clean_json.strip()

        try:
            decision = json.loads(clean_json)
            print(f"[ROUTER] Decision: action={decision.get('action')}, skill={decision.get('requested_skill')}")
        except Exception as e:
            print(f"[!] JSON parse error: {e}")
            decision = {"action": "CHAT", "requested_skill": "none", "updates": {}}

        # --- PHASE 3: CAPTURE REASONING ---
        reasoning_text = decision.get("reasoning", "Processing user request")
        certainty = decision.get("certainty", 0.8)
        assumptions_list = decision.get("assumptions", [])

        # Store reasoning
        agent_thought = AgentReasoning(
            agent_name="Router",
            thought=reasoning_text,
            certainty=certainty
        )
        state.agent_reasoning.append(agent_thought)
        print(f"[ROUTER] Reasoning: {reasoning_text[:80]}... (Certainty: {certainty})")

        # Store assumptions
        if assumptions_list:
            existing_assumptions = state.project_meta.get("assumptions", [])
            state.project_meta["assumptions"] = existing_assumptions + assumptions_list
            print(f"[ROUTER] Assumptions: {assumptions_list}")

        # --- PHASE 4: APPLY STATE UPDATES ---
        updates = decision.get("updates", {})
        if updates:
            # Use the field updater utility to handle updates with proper source tracking
            update_state_from_router_updates(state, updates, assumptions_list)

        # --- PHASE 4.5: URL DETECTION FOR RESEARCH ---
        # Check if user message contains a URL and store it for the Research Agent
        detected_url = extract_url_from_text(user_message)
        if detected_url:
            state.additional_context["business_url"] = detected_url
            state.logs.append(f"System: Detected URL - {detected_url}")
            print(f"[ROUTER] URL detected: {detected_url}")

        # --- PHASE 5: AUTO-CRM & AUDIT (if in intake) ---
        if state.project_name and not state.crm_data:
            print(f"[ROUTER] Fetching CRM for: {state.project_name}")
            crm_result = mock_hubspot_fetcher(state.project_name)
            state.crm_data = crm_result if crm_result is not None else {}

        if state.current_step == StepName.INTAKE.value:
            from agents.intake_agent import run_intake_agent
            state = run_intake_agent(state)

            if not state.missing_info:
                state.logs.append("Auditor: All required information gathered. Ready to proceed.")

        print(f"[ROUTER] Audit complete. Missing info: {state.missing_info}")

        # --- PHASE 6: EXECUTE INTENT ---
        action = decision.get("action", "CHAT")

        if action in ["INVOKE", "REVISE", "PROCEED"]:
            yield from _execute_intent(state, decision, user_message, registry)

        # --- PHASE 7: GENERATE CHAT RESPONSE ---
        print(f"[ROUTER] Generating chat response...")

        # Use the chat response generator utility
        response_data = get_chat_response_data(state, user_message)

        state.logs.append(f"Router: Action={action}, Step={state.current_step}")

        chat_prompt = get_filled_prompt("chat_response", response_data)

        full_response = ""
        for chunk in stream_gemini(chat_prompt, model_type="flash"):
            full_response += chunk
            yield chunk

        # --- PHASE 8: FINALIZE ---
        state.chat_history.append({"role": "assistant", "content": full_response})

        # Emit gate action for intake approval if intake is complete and no missing info
        if state.current_step == StepName.INTAKE.value and not state.missing_info:
            gate_name = get_gate_name_for_step(StepName.INTAKE.value, "Intake & Audit")
            yield f"\n\n[GATE_ACTION: {gate_name}]\n"

        # Memory compression (every 5 turns)
        chat_turn_count = len(state.chat_history) // 2
        if chat_turn_count > 0 and chat_turn_count % 5 == 0:
            print(f"[ROUTER] Compressing memory (Turn {chat_turn_count})")
            try:
                state.context_summary = summarize_project_context(state)
                state.logs.append("System: Memory compressed.")
            except Exception as e:
                print(f"[!] Summarization error: {str(e)}")

        # Log agent action
        log_agent_action("Router", user_message, extraction_raw)

        # Send state update to frontend
        state_dict = state.model_dump()
        final_json = json.dumps(state_dict, ensure_ascii=False)

        # #region agent log
        try:
            from datetime import datetime
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "router_agent.py:run_router_agent", "message": "Sending state update", "data": {"current_step": state.current_step, "has_generated_code": bool(state.generated_code), "generated_code_length": len(state.generated_code) if state.generated_code else 0, "generated_code_preview": state.generated_code[:100] if state.generated_code else None}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "B"}) + "\n")
        except: pass
        # #endregion

        yield f"\n\n{STATE_UPDATE_MARKER}\n"
        yield final_json

        print(f"[ROUTER] Completed successfully.")

    except Exception as e:
        print(f"\n[!] ROUTER CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
        yield f"\n\n[System Error: {str(e)}]"
