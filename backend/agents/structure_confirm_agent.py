from utils import emit_progress_event
from state_schema import WebsiteState
from agents.planner_agent import run_planner_agent

def run_structure_confirm_agent(state: WebsiteState, feedback: str = None):
    """
    Structure Confirm Agent: Wrapper around planning agent that:
    1. Calls planner_agent to generate sitemap
    2. Emits progress events
    3. Returns for GATE B (structure approval)

    This is a thin wrapper to maintain backward compatibility with existing planner_agent.
    """

    # Emit progress start
    emit_progress_event(state, "structure_confirm", "Architecting site structure...")

    # Delegate to existing planner agent
    for chunk in run_planner_agent(state, feedback=feedback):
        yield chunk

    # Emit completion event
    if state.sitemap:
        page_count = len(state.sitemap)
        emit_progress_event(
            state,
            "structure_confirm",
            f"Sitemap created with {page_count} pages",
            artifact_refs=["sitemap"]
        )

    state.logs.append("Structure Confirm: Awaiting user approval of sitemap.")
