# backend/agents/router_agent.py
import json
import traceback # Added for better error reporting
from utils import get_filled_prompt, ask_gemini, stream_gemini, log_agent_action
from state_schema import WebsiteState
from services import mock_hubspot_fetcher

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

        # --- PHASE 3: APPLY UPDATES ---
        updates = decision.get("updates", {})
        if updates:
            # We map common AI mistakes to our schema keys
            FIELD_MAP = {
                "name": "project_name",
                "colors": "brand_colors",
                "style": "design_style"
            }
            for key, value in updates.items():
                target_key = FIELD_MAP.get(key.lower(), key)
                if hasattr(state, target_key) and value:
                    # Special check: colors must be a list
                    if target_key == "brand_colors" and isinstance(value, str):
                        value = [value]
                    setattr(state, target_key, value)
                    print(f"    - Updated State: {target_key} = {value}")

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

        # --- PHASE 5: THE STATE MACHINE (The "Phase Gate" Fix) ---
        action = decision.get("action", "CHAT")

        # 1. INTAKE -> PLANNING (Only when user says PROCEED and we have all info)
        if state.current_step == "intake" and not state.missing_info and action == "PROCEED":
            state.current_step = "planning"
            state.logs.append("System: User confirmed. Moving to Planning phase.")
            if not state.sitemap:
                yield "🏗️ **Building Sitemap...**\n\n"
                from agents.planner_agent import run_planner_agent
                for chunk in run_planner_agent(state): yield chunk

        # 2. PLANNING -> PRD (Only when user confirms the sitemap)
        elif state.current_step == "planning" and action == "PROCEED":
            state.current_step = "prd"  # Move to PRD step
            state.logs.append("System: User approved sitemap. Moving to PRD phase.")
            yield "📄 **Generating Technical PRD...**\n\n"
            from agents.prd_agent import run_prd_agent
            for chunk in run_prd_agent(state): yield chunk
            # We STAY in "prd" step after this so the user can review it.

<<<<<<< HEAD
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
=======
        # 3. PRD -> BUILDING (Only when user confirms the PRD)
        elif state.current_step == "prd" and action == "PROCEED":
            state.current_step = "building"  # Move to Building step
            state.logs.append("System: User approved PRD. Starting build phase.")
            yield "🚀 **Starting the Build...**\n\n"
            from agents.builder_agent import run_builder_agent
            for chunk in run_builder_agent(state): yield chunk

        # 3. THE REVISE TRIGGER (User wants changes)
>>>>>>> parent of 8cede23 (Multi Agent Version with registry)
        elif action == "REVISE":
            if state.current_step == "planning":
                yield "🔄 **Updating Sitemap...**\n\n"
                from agents.planner_agent import run_planner_agent
                for chunk in run_planner_agent(state, feedback=user_message): yield chunk
            elif state.current_step == "prd":
                yield "🔄 **Updating Technical Brief...**\n\n"
                from agents.prd_agent import run_prd_agent
                for chunk in run_prd_agent(state, feedback=user_message): yield chunk
            elif state.current_step == "building":
                yield "🛠️ **Tweaking the Code...**\n\n"
                from agents.builder_agent import run_builder_agent
                for chunk in run_builder_agent(state, feedback=user_message): yield chunk

<<<<<<< HEAD
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
=======
        # --- PHASE 6: REVISION LOGIC ---
        elif action == "REVISE":
            if state.current_step == "wireframing": # Editing Sitemap
                from agents.planner_agent import run_planner_agent
                for chunk in run_planner_agent(state, feedback=user_message): yield chunk
            elif state.current_step == "building": # Editing PRD
                from agents.prd_agent import run_prd_agent
                for chunk in run_prd_agent(state, feedback=user_message): yield chunk
>>>>>>> parent of 8cede23 (Multi Agent Version with registry)

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

<<<<<<< HEAD
        # MAGICAL FLOW: Define chat constraints for each phase
        constraints = {
            "intake": "If only non-critical fields are missing, you can proceed automatically. If critical fields (audience, offer, goal, location) are missing, ask targeted questions.",
            "direction_lock": "GATE A: You've crystallized the strategic direction. Present the direction snapshot concisely (3-5 bullets). Ask: 'Does this direction feel right?' Wait for approval.",
            "structure_confirm": "GATE B: You've architected the site structure. Count the pages and say: 'I've designed a sitemap with [X] pages. Review the structure. Ready to proceed?' Wait for approval.",
            "copywriting": "Copy is being generated as a draft. It will be refined during reveal. Keep it brief.",
            "prd": "Technical specifications are being generated automatically. Keep it brief.",
            "building": "The website is being built automatically. Talk about the code generation.",
            "reveal": "Present the website preview. Invite feedback but don't block - the user can refine or proceed to launch."
=======
        # Define a strict constraint based on the current step
        constraints = {
            "intake": "If missing_info is empty, congratulate them and tell them you have everything needed. Then ask: 'Ready to create the sitemap?' Wait for their confirmation. If still missing info, ask for it.",
            "planning": "Present the sitemap and ask if they like it or want changes. DO NOT automatically move to PRD. Wait for explicit approval.",
            "prd": "Present the technical PRD and ask for approval before building. Wait for them to say they're ready.",
            "building": "Talk about the code and the live preview."
>>>>>>> parent of 8cede23 (Multi Agent Version with registry)
        }

        response_data = state.model_dump()
        response_data['user_message'] = user_message
        response_data['response_strategy'] = constraints.get(state.current_step, "Be concise.")
        response_data['prd_length'] = len(state.prd_document)

        state.logs.append(f"Router decided to stay in {state.current_step} stage. Action: {action}")
        
        chat_prompt = get_filled_prompt("chat_response", response_data)
        
        full_response = ""
        for chunk in stream_gemini(chat_prompt, model_type="flash"):
            full_response += chunk
            yield chunk

        # --- PHASE 8: FINAL WRAP UP ---
        state.chat_history.append({"role": "assistant", "content": full_response})

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