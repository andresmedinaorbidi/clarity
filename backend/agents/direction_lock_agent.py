import json
from datetime import datetime
from utils import get_filled_prompt, stream_gemini, log_agent_action, emit_progress_event
from state_schema import WebsiteState, AgentReasoning

def run_direction_lock_agent(state: WebsiteState, feedback: str = None):
    """
    Direction Lock Agent: Creates a concise "direction snapshot" summarizing:
    - Core business objective
    - Target audience
    - Primary conversion goal
    - Key brand positioning

    This snapshot is frozen and used by downstream agents as approved assumptions.
    GATE A: User must approve this direction before UX work begins.
    """

    # Emit progress start
    emit_progress_event(state, "direction_lock", "Crystallizing project direction...")

    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the direction snapshot based on this feedback: '{feedback}'."
        state.logs.append(f"Direction Lock: Refining direction with feedback: {feedback}")
    else:
        instruction = "Create a concise direction snapshot (3-5 bullet points) that captures the strategic essence of this project."
        state.logs.append("Direction Lock: Creating strategic direction snapshot.")

    # 2. Prepare data for prompt
    # Create a safe dict with only the fields needed for the template
    state_dict = {
        'instruction': instruction,
        'project_name': state.project_name or 'Not specified',
        'industry': state.industry or 'Not specified',
        'design_style': state.design_style or 'Not specified',
    }

    # Extract and format business_goals from project_meta (it's a list)
    goals_list = state.project_meta.get('business_goals', [])
    if goals_list and isinstance(goals_list, list):
        state_dict['business_goals'] = '\n'.join(f"- {goal}" for goal in goals_list)
    else:
        state_dict['business_goals'] = 'Not yet defined'

    # Extract target_audience from project_meta (it's a string)
    state_dict['target_audience'] = state.project_meta.get('target_audience', 'Not yet defined')

    # Convert brand_colors list to comma-separated string
    if state.brand_colors and isinstance(state.brand_colors, list):
        state_dict['brand_colors'] = ', '.join(state.brand_colors)
    else:
        state_dict['brand_colors'] = 'Not specified'

    state_dict['format_instructions'] = """Return ONLY valid JSON with this structure:
{
  "direction_snapshot": "3-5 concise bullet points capturing: business objective, target audience, primary goal, brand positioning",
  "approved_assumptions": {
    "audience": "Who we're targeting",
    "offer": "What we're offering",
    "goal": "Primary conversion goal",
    "positioning": "Market positioning"
  },
  "reasoning": "Why this direction makes strategic sense"
}"""

    # 3. Load prompt template
    filled_prompt = get_filled_prompt("direction_lock_agent", state_dict)

    # 4. Stream response
    yield "🎯 **Crystallizing Direction**\n\n"

    full_response = ""
    try:
        for chunk in stream_gemini(filled_prompt, json_mode=True):
            full_response += chunk
            yield ""  # Keep connection alive

        # 5. Parse result
        clean_json = full_response.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[-1].rsplit("\n", 1)[0].strip()
        if clean_json.startswith("json"):
            clean_json = clean_json[4:].strip()

        data = json.loads(clean_json)

        # 6. Populate state
        if isinstance(data, dict):
            # Store direction snapshot (ensure it's a string, even if Gemini returns a list)
            snapshot_data = data.get("direction_snapshot", "")
            if isinstance(snapshot_data, list):
                # Gemini returned a list of bullet points, join them
                state.direction_snapshot = '\n'.join(f"• {item}" for item in snapshot_data)
            else:
                state.direction_snapshot = str(snapshot_data)

            # LOCK APPROVED ASSUMPTIONS
            state.assumptions["approved"] = data.get("approved_assumptions", {})

            # Store reasoning
            reasoning_text = data.get("reasoning", "Strategic direction defined.")
            direction_reasoning = AgentReasoning(
                agent_name="Direction Lock",
                thought=reasoning_text,
                certainty=0.9
            )
            state.agent_reasoning.append(direction_reasoning)

            state.logs.append("Direction Lock: Strategic direction frozen and approved.")

            # Emit completion event
            emit_progress_event(
                state,
                "direction_lock",
                "Direction locked: " + state.direction_snapshot[:50] + "...",
                artifact_refs=["direction_snapshot"]
            )

            print(f"[DIRECTION LOCK] Snapshot: {state.direction_snapshot[:100]}")
        else:
            raise ValueError("Invalid JSON structure")

    except Exception as e:
        import traceback
        error_msg = f"Direction Lock Error: {str(e)}"
        traceback_str = traceback.format_exc()
        print(f"!!! {error_msg}")
        print(f"!!! Full traceback:\n{traceback_str}")
        state.logs.append(error_msg)
        # Fallback
        state.direction_snapshot = f"Error generating direction snapshot: {str(e)}"

    # Final logging
    log_agent_action("Direction Lock Agent", filled_prompt, full_response)
