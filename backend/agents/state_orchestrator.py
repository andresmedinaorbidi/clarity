# backend/agents/state_orchestrator.py
"""
State Orchestrator

Handles state update coordination, CRM data fetching, URL detection,
and intake audit operations.
"""

from state_schema import WebsiteState, AgentReasoning
from services import mock_hubspot_fetcher
from utils_scraper import extract_url_from_text
from helpers.field_updater import update_state_from_router_updates
from constants import StepName


def apply_state_updates(
    state: WebsiteState,
    updates: dict,
    assumptions_list: list
) -> None:
    """
    Apply state updates from router decisions.
    
    Args:
        state: WebsiteState to update
        updates: Dictionary of field updates
        assumptions_list: List of fields that were assumed/inferred
    """
    if not updates:
        return
    
    print(f"[STATE_ORCHESTRATOR] Applying {len(updates)} state updates")
    update_state_from_router_updates(state, updates, assumptions_list)


def detect_and_store_url(state: WebsiteState, user_message: str) -> None:
    """
    Detect URL in user message and store it for Research Agent.
    
    Args:
        state: WebsiteState to update
        user_message: User's message to scan for URLs
    """
    detected_url = extract_url_from_text(user_message)
    if detected_url:
        state.additional_context["business_url"] = detected_url
        state.logs.append(f"System: Detected URL - {detected_url}")
        print(f"[STATE_ORCHESTRATOR] URL detected: {detected_url}")


def fetch_crm_data(state: WebsiteState) -> None:
    """
    Fetch CRM data if project name is available and CRM data not yet fetched.
    
    Args:
        state: WebsiteState to update
    """
    if state.project_name and not state.crm_data:
        print(f"[STATE_ORCHESTRATOR] Fetching CRM for: {state.project_name}")
        crm_result = mock_hubspot_fetcher(state.project_name)
        state.crm_data = crm_result if crm_result is not None else {}


def run_intake_audit(state: WebsiteState) -> WebsiteState:
    """
    Run intake agent audit to check for missing information.
    
    Args:
        state: WebsiteState to audit
        
    Returns:
        Updated WebsiteState after audit
    """
    if state.current_step == StepName.INTAKE.value:
        from agents.intake_agent import run_intake_agent
        state = run_intake_agent(state)
        
        if not state.missing_info:
            state.logs.append("Auditor: All required information gathered. Ready to proceed.")
    
    print(f"[STATE_ORCHESTRATOR] Audit complete. Missing info: {state.missing_info}")
    return state


def store_reasoning(
    state: WebsiteState,
    reasoning_text: str,
    certainty: float,
    assumptions_list: list
) -> None:
    """
    Store agent reasoning and assumptions in state.
    
    Args:
        state: WebsiteState to update
        reasoning_text: Reasoning text from intent analyzer
        certainty: Certainty score (0.0-1.0)
        assumptions_list: List of assumptions made
    """
    # Store reasoning
    agent_thought = AgentReasoning(
        agent_name="Router",
        thought=reasoning_text,
        certainty=certainty
    )
    state.agent_reasoning.append(agent_thought)
    print(f"[STATE_ORCHESTRATOR] Reasoning: {reasoning_text[:80]}... (Certainty: {certainty})")
    
    # Store assumptions
    if assumptions_list:
        existing_assumptions = state.project_meta.get("assumptions", [])
        state.project_meta["assumptions"] = existing_assumptions + assumptions_list
        print(f"[STATE_ORCHESTRATOR] Assumptions: {assumptions_list}")
