import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_strategy_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Analyzes business goals and defines strategic positioning.
    Populates state.project_meta with business objectives, target audience, and success metrics.
    Yields status updates during processing.
    """
    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the business strategy based on this user feedback: '{feedback}'."
        state.logs.append(f"Strategy Agent: Refining strategy with feedback: {feedback}")
    else:
        instruction = "Define the business goals, target audience, and success metrics for this project."
        state.logs.append("Strategy Agent: Analyzing business objectives and target market.")

    # 2. Prepare data for the prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = """Return ONLY valid JSON with this structure:
{
  "business_goals": ["Goal 1", "Goal 2", "Goal 3"],
  "target_audience": "Description of primary target audience",
  "success_metrics": ["Metric 1", "Metric 2"],
  "brand_positioning": "One sentence describing market positioning",
  "reasoning": "Why these goals and audience make sense for this business"
}"""

    # 3. Load and fill the external prompt file
    filled_prompt = get_filled_prompt("strategy_agent", state_dict)

    # 4. START THE STREAM
    yield " 🎯  Strategist is defining business goals... "

    full_response = ""

    try:
        for chunk in stream_gemini(filled_prompt, json_mode=True):
            full_response += chunk
            yield ""  # Keep connection alive without showing JSON

        # 5. PROCESS THE RESULT
        clean_json = full_response.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[-1].rsplit("\n", 1)[0].strip()
        if clean_json.startswith("json"):
            clean_json = clean_json[4:].strip()

        data = json.loads(clean_json)

        # 6. POPULATE STATE
        if isinstance(data, dict):
            # Store in project_meta
            state.project_meta["business_goals"] = data.get("business_goals", [])
            state.project_meta["target_audience"] = data.get("target_audience", "")
            state.project_meta["success_metrics"] = data.get("success_metrics", [])
            state.project_meta["brand_positioning"] = data.get("brand_positioning", "")

            # 7. CAPTURE REASONING
            reasoning_text = data.get("reasoning", "Analyzed business context and defined strategic objectives.")
            strategy_reasoning = AgentReasoning(
                agent_name="Strategist",
                thought=reasoning_text,
                certainty=0.85
            )
            state.agent_reasoning.append(strategy_reasoning)

            state.logs.append(f"Strategy Agent: Business goals defined - {len(data.get('business_goals', []))} objectives identified.")
            print(f"[STRATEGY] Goals: {state.project_meta['business_goals']}")
        else:
            raise ValueError("Invalid JSON structure returned")

    except Exception as e:
        error_msg = f"Strategy Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent crash
        if not state.project_meta.get("business_goals"):
            state.project_meta["business_goals"] = ["Increase online visibility", "Generate qualified leads"]
            state.project_meta["target_audience"] = "General market"

    # 6. Final Terminal Log
    log_agent_action("Strategy Agent", filled_prompt, full_response)
