# backend/agents/router_agent.py
"""
Intent-Driven Router Agent

This router analyzes user messages to determine intent and invoke the appropriate skill.
It supports both direct skill invocation and linear progression through the build flow.
Includes automatic URL detection for the Research Agent.

Refactored to use separate modules:
- IntentAnalyzer: Pure intent extraction
- StateOrchestrator: State update coordination
- SkillExecutor: Skill execution wrapper
"""

import json
import traceback
from utils import get_filled_prompt, stream_gemini, log_agent_action, summarize_project_context
from state_schema import WebsiteState
from agents.registry import get_registry
from helpers.chat_response_generator import get_chat_response_data
from constants import StepName, STATE_UPDATE_MARKER, get_gate_name_for_step

# Import refactored modules
from agents.intent_analyzer import analyze_intent
from agents.state_orchestrator import (
    apply_state_updates,
    detect_and_store_url,
    fetch_crm_data,
    run_intake_audit,
    store_reasoning
)
from agents.skill_executor import execute_intent


def run_router_agent(state: WebsiteState, user_message: str):
    """
    Main router entry point - Intent-Driven Architecture.

    Analyzes user messages to determine intent and routes to appropriate skills.
    Supports: direct invocation, linear progression, revision, and chat.

    Refactored to use separate modules for better separation of concerns:
    - IntentAnalyzer: Pure intent extraction
    - StateOrchestrator: State update coordination
    - SkillExecutor: Skill execution wrapper

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

        # --- PHASE 1: INTENT ANALYSIS ---
        decision = analyze_intent(state, user_message)
        extraction_raw = json.dumps(decision.raw, ensure_ascii=False)

        # --- PHASE 2: STORE REASONING & ASSUMPTIONS ---
        store_reasoning(
            state,
            decision.reasoning,
            decision.certainty,
            decision.assumptions
        )

        # --- PHASE 3: APPLY STATE UPDATES ---
        apply_state_updates(state, decision.updates, decision.assumptions)

        # --- PHASE 4: URL DETECTION FOR RESEARCH ---
        detect_and_store_url(state, user_message)

        # --- PHASE 5: AUTO-CRM & AUDIT ---
        fetch_crm_data(state)
        state = run_intake_audit(state)

        # --- PHASE 6: EXECUTE INTENT ---
        if decision.action in ["INVOKE", "REVISE", "PROCEED"]:
            yield from execute_intent(state, decision, user_message, registry)

        # --- PHASE 7: GENERATE CHAT RESPONSE ---
        print(f"[ROUTER] Generating chat response...")

        # Use the chat response generator utility
        response_data = get_chat_response_data(state, user_message)

        state.logs.append(f"Router: Action={decision.action}, Step={state.current_step}")

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
