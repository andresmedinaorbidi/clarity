# backend/agents/router_agent.py
import json
import traceback # Added for better error reporting
from utils import get_filled_prompt, ask_gemini, stream_gemini, log_agent_action, summarize_project_context
from state_schema import WebsiteState, AgentReasoning
from services import mock_hubspot_fetcher
from agents.registry import get_registry

def _execute_skill_chain(state, current_skill, registry):
    """
    Helper function to execute a chain of skills.
    Automatically chains skills that don't require approval.
    Stops at skills that need user confirmation.
    """
    next_step = current_skill.get_handoff_suggestion()

    while next_step:
        # Transition to next step
        state.current_step = next_step
        state.logs.append(f"System: Moving to {next_step} phase.")

        # Log handoff in agent reasoning
        handoff_reasoning = AgentReasoning(
            agent_name="Router",
            thought=f"Transitioning from {current_skill.name} to {next_step} skill.",
            certainty=1.0
        )
        state.agent_reasoning.append(handoff_reasoning)
        print(f"[5.1] HANDOFF: {current_skill.id} -> {next_step}")

        # Get and execute the next skill
        next_skill = registry.get_by_step(next_step)
        if next_skill:
            # Short, distinctive handoff message for frontend detection
            if next_step == "planning":
                yield "🏗️ **Building Sitemap**\n\n"
            elif next_step == "prd":
                yield "📋 **Drafting Technical Spec**\n\n"
            elif next_step == "building":
                yield "🚀 **Starting Build**\n\n"
            else:
                yield f"{next_skill.icon} **{next_skill.name}**\n\n"

            for chunk in next_skill.execute(state):
                yield chunk

            # Check if we should continue the chain
            if next_skill.requires_approval:
                # Stop here and wait for user approval
                print(f"[5.2] SKILL CHAIN PAUSED: {next_skill.name} requires approval")
                break
            else:
                # Continue to next skill automatically
                print(f"[5.2] AUTO-CHAIN: {next_skill.name} completed, continuing...")
                current_skill = next_skill
                next_step = current_skill.get_handoff_suggestion()
        else:
            # No skill found for this step
            break

def run_router_agent(state: WebsiteState, user_message: str):
    print(f"\n[1] ROUTER STARTING... Message: {user_message}")
    yield " " # Immediate pulse to browser

    try:
        # --- PHASE 1: PREPARE PROMPT ---
        # We must ensure EVERY variable in router_agent.txt is here
        state_dict = state.model_dump()
        state_dict['user_message'] = user_message
        state_dict['format_instructions'] = "Return ONLY JSON."
        
        # Verify the file is found and filled
        print(f"[2] LOADING PROMPT: router_agent.txt")
        filled_prompt = get_filled_prompt("router_agent", state_dict)
        
        # --- PHASE 2: EXTRACTION ---
        extraction_raw = ask_gemini(filled_prompt, json_mode=True)

        # THE AGGRESSIVE CLEANER
        clean_json = extraction_raw.strip()
        if "```" in clean_json:
            # This removes ```json at the start and ``` at the end
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        clean_json = clean_json.strip()

        try:
            decision = json.loads(clean_json)
            print(f"[4] CLEANED JSON: {decision}") # Watch your terminal for this!
        except Exception as e:
            print(f"[!] JSON PARSE ERROR: {e} | RAW: {extraction_raw}")
            decision = {"action": "CHAT", "updates": {}}

        # --- PHASE 2.5: CAPTURE REASONING ---
        reasoning_text = decision.get("reasoning", "No reasoning provided")
        certainty = decision.get("certainty", 0.8)
        assumptions_list = decision.get("assumptions", [])

        # Create an AgentReasoning object and append to state
        agent_thought = AgentReasoning(
            agent_name="Router",
            thought=reasoning_text,
            certainty=certainty
        )
        state.agent_reasoning.append(agent_thought)
        print(f"[4.5] REASONING CAPTURED: {reasoning_text} (Certainty: {certainty})")

        # Store assumptions in project_meta for transparency
        if assumptions_list:
            state.project_meta["assumptions"] = state.project_meta.get("assumptions", []) + assumptions_list
            print(f"[4.6] ASSUMPTIONS LOGGED: {assumptions_list}")

        # --- PHASE 3: APPLY UPDATES ---
        updates = decision.get("updates", {})
        if updates:
            # We map common AI mistakes to our schema keys
            FIELD_MAP = {
                "name": "project_name",
                "colors": "brand_colors",
                "style": "design_style"
            }

            # Initialize inferred_fields list if it doesn't exist
            if "inferred_fields" not in state.project_meta:
                state.project_meta["inferred_fields"] = []

            for key, value in updates.items():
                target_key = FIELD_MAP.get(key.lower(), key)
                if hasattr(state, target_key) and value:
                    # Special check: colors must be a list
                    if target_key == "brand_colors" and isinstance(value, str):
                        value = [value]
                    setattr(state, target_key, value)
                    print(f"    - Updated State: {target_key} = {value}")

                    # Track inferred fields: if this key is in assumptions_list, mark it as inferred
                    if key in assumptions_list or target_key in assumptions_list:
                        if target_key not in state.project_meta["inferred_fields"]:
                            state.project_meta["inferred_fields"].append(target_key)
                            print(f"    - Marked as INFERRED: {target_key}")

        # --- PHASE 4: AUTO-CRM & AUDIT ---
        if state.project_name and not state.crm_data:
            print(f"[5] FETCHING CRM FOR: {state.project_name}")
            state.crm_data = mock_hubspot_fetcher(state.project_name)

        # Only run the Intake/Auditor agent if we are still in the intake phase
        if state.current_step == "intake":
            from agents.intake_agent import run_intake_agent
            state = run_intake_agent(state)

            # Log when intake is complete, but DON'T auto-advance
            if not state.missing_info:
                state.logs.append("✅ Auditor: All required information gathered. Waiting for user confirmation.")
        else:
            # Optional: If we are past intake, we can skip the audit entirely to save tokens/time
            pass
        print(f"[6] AUDIT COMPLETE. Missing info: {state.missing_info}")

        # --- PHASE 5: SKILL REGISTRY ORCHESTRATION ---
        action = decision.get("action", "CHAT")
        registry = get_registry()

        print(f"[5] SKILL ORCHESTRATION: Action={action}, Step={state.current_step}")

        # PROCEED: Advance to next skill (with phase gate approval)
        if action == "PROCEED":
            current_skill = registry.get_by_step(state.current_step)

            if current_skill:
                # MAGICAL FLOW: Check critical fields for intake auto-proceed
                if state.current_step == "intake":
                    critical_missing = [f for f in state.missing_info if f.lower() in ["audience", "offer", "location", "service area", "primary goal", "conversion goal"]]
                    if critical_missing:
                        print(f"[!] Cannot proceed from intake: critical fields missing: {critical_missing}")
                        pass
                    else:
                        # Auto-proceed if only non-critical fields missing
                        yield from _execute_skill_chain(state, current_skill, registry)
                else:
                    # Execute skill chain (may include multiple auto-executing skills)
                    yield from _execute_skill_chain(state, current_skill, registry)

        # REVISE: User wants to modify current deliverable (backward compat)
        elif action == "REVISE":
            current_skill = registry.get_by_step(state.current_step)

            if current_skill and current_skill.revision_supported:
                print(f"[5.2] REVISION REQUESTED: {current_skill.name}")
                state.logs.append(f"System: Revising {current_skill.name} based on feedback.")

                # Log revision reasoning
                revision_reasoning = AgentReasoning(
                    agent_name="Router",
                    thought=f"User requested changes to {current_skill.name}. Applying feedback: '{user_message[:50]}...'",
                    certainty=0.9
                )
                state.agent_reasoning.append(revision_reasoning)

                # Short revision message
                if state.current_step == "planning" or state.current_step == "structure_confirm":
                    yield "🔄 **Updating Sitemap**\n\n"
                elif state.current_step == "prd":
                    yield "🔄 **Revising Spec**\n\n"
                else:
                    yield f"🔄 **Updating**\n\n"

                for chunk in current_skill.execute(state, feedback=user_message):
                    yield chunk
            else:
                state.logs.append(f"System: Revision not supported for {state.current_step}")
                print(f"[!] REVISION NOT SUPPORTED: {state.current_step}")

        # EDIT_DIRECTION: Scoped action for direction_lock phase
        elif action == "EDIT_DIRECTION":
            if state.current_step == "direction_lock":
                direction_skill = registry.get("direction_lock")
                if direction_skill:
                    print(f"[5.3] EDIT DIRECTION: Revising strategic direction")
                    state.logs.append("System: Editing strategic direction based on feedback.")
                    yield "🔄 **Revising Direction**\n\n"
                    for chunk in direction_skill.execute(state, feedback=user_message):
                        yield chunk
            else:
                state.logs.append("System: EDIT_DIRECTION only available during direction_lock phase")

        # EDIT_STRUCTURE: Scoped action for structure_confirm phase
        elif action == "EDIT_STRUCTURE":
            if state.current_step == "structure_confirm":
                structure_skill = registry.get("structure_confirm")
                if structure_skill:
                    print(f"[5.4] EDIT STRUCTURE: Revising sitemap")
                    state.logs.append("System: Editing site structure based on feedback.")
                    yield "🔄 **Revising Structure**\n\n"
                    for chunk in structure_skill.execute(state, feedback=user_message):
                        yield chunk
            else:
                state.logs.append("System: EDIT_STRUCTURE only available during structure_confirm phase")

        # FEEDBACK: General feedback during reveal or post-approval phases
        elif action == "FEEDBACK":
            print(f"[5.5] FEEDBACK: User provided general feedback")
            state.logs.append(f"System: Feedback logged: {user_message[:100]}")
            # Store feedback but don't rewind - let chat response handle it
            if state.current_step == "reveal":
                reveal_skill = registry.get("reveal")
                if reveal_skill:
                    for chunk in reveal_skill.execute(state, feedback=user_message):
                        yield chunk

        # --- PHASE 7: CHAT RESPONSE ---
        # We use prompts/chat_response.txt for the personality
        print(f"[7] GENERATING CHAT RESPONSE...")

        # MAGICAL FLOW: Define chat constraints for each phase
        constraints = {
            "intake": "If only non-critical fields are missing, you can proceed automatically. If critical fields (audience, offer, goal, location) are missing, ask targeted questions.",
            "direction_lock": "GATE A: You've crystallized the strategic direction. Present the direction snapshot concisely (3-5 bullets). Ask: 'Does this direction feel right?' Wait for approval.",
            "structure_confirm": "GATE B: You've architected the site structure. Count the pages and say: 'I've designed a sitemap with [X] pages. Review the structure. Ready to proceed?' Wait for approval.",
            "copywriting": "Copy is being generated as a draft. It will be refined during reveal. Keep it brief.",
            "prd": "Technical specifications are being generated automatically. Keep it brief.",
            "building": "The website is being built automatically. Talk about the code generation.",
            "reveal": "Present the website preview. Invite feedback but don't block - the user can refine or proceed to launch."
        }

        response_data = state.model_dump()
        response_data['user_message'] = user_message
        response_data['response_strategy'] = constraints.get(state.current_step, "Be concise.")
        response_data['prd_length'] = len(state.prd_document)

        # Pass assumptions to the chat response for acknowledgment
        assumptions_str = ", ".join(state.project_meta.get("assumptions", []))
        response_data['assumptions'] = assumptions_str if assumptions_str else "None"

        state.logs.append(f"Router decided to stay in {state.current_step} stage. Action: {action}")
        
        chat_prompt = get_filled_prompt("chat_response", response_data)
        
        full_response = ""
        for chunk in stream_gemini(chat_prompt, model_type="flash"):
            full_response += chunk
            yield chunk

        # --- PHASE 8: FINAL WRAP UP ---
        state.chat_history.append({"role": "assistant", "content": full_response})

        # --- PHASE 8.5: MEMORY COMPRESSION ---
        # Trigger summarization if chat history is getting long (every 5 turns)
        chat_turn_count = len(state.chat_history) // 2  # Each turn = user + assistant
        if chat_turn_count > 0 and chat_turn_count % 5 == 0:
            print(f"[8.5] MEMORY COMPRESSION: Summarizing project context (Turn {chat_turn_count})")
            try:
                state.context_summary = summarize_project_context(state)
                state.logs.append("System: Project context compressed and saved to memory.")
                print(f"[8.5] SUMMARY GENERATED: {state.context_summary[:100]}...")
            except Exception as e:
                print(f"[!] SUMMARIZATION ERROR: {str(e)}")
                state.logs.append(f"System: Memory compression failed: {str(e)}")

        # 2. Convert to DICT first (Crucial: this strips Pydantic's extra escaping)
        state_dict = state.model_dump()
        
        # LOGGING (This will now definitely show up because it's inside the try block)
        log_agent_action("Router", user_message, extraction_raw)

        # FINAL SYNC DELIMITER
        # 3. Use standard json.dumps with ensure_ascii=False 
        # This preserves the "real" characters rather than converting them to unicode codes
        final_json = json.dumps(state_dict, ensure_ascii=False)
        
        # 4. Yield the marker with clear separation
        yield "\n\n|||STATE_UPDATE|||\n"
        yield final_json

        print(f"[8] ROUTER FINISHED SUCCESSFULLY.")

    except Exception as e:
        print(f"\n[!] ROUTER CRITICAL ERROR: {str(e)}")
        traceback.print_exc() # This prints the EXACT line number of the error
        yield f"\n\n[System Error: {str(e)}]"