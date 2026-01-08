import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_ux_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Defines user personas and conversion strategies.
    Populates state.ux_strategy with user journey maps, personas, and conversion points.
    Yields status updates during processing.
    """
    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the UX strategy based on this user feedback: '{feedback}'."
        state.logs.append(f"UX Agent: Refining user experience strategy with feedback: {feedback}")
    else:
        instruction = "Define user personas, pain points, and conversion paths for this project."
        state.logs.append("UX Agent: Mapping user personas and conversion strategies.")

    # 2. Prepare data for the prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = """Return ONLY valid JSON with this structure:
{
  "primary_persona": {
    "name": "Persona Name",
    "demographics": "Age, location, occupation",
    "pain_points": ["Pain 1", "Pain 2"],
    "goals": ["Goal 1", "Goal 2"]
  },
  "user_journey": ["Stage 1: Discovery", "Stage 2: Consideration", "Stage 3: Conversion"],
  "conversion_points": ["CTA 1", "CTA 2", "CTA 3"],
  "ux_priorities": ["Priority 1", "Priority 2"],
  "reasoning": "Why this persona and journey make sense for this business"
}"""

    # 3. Load and fill the external prompt file
    filled_prompt = get_filled_prompt("ux_agent", state_dict)

    # 4. START THE STREAM
    yield " 🎨  UX Designer is mapping user personas... "

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
            # Store in ux_strategy
            state.ux_strategy = {
                "primary_persona": data.get("primary_persona", {}),
                "user_journey": data.get("user_journey", []),
                "conversion_points": data.get("conversion_points", []),
                "ux_priorities": data.get("ux_priorities", [])
            }

            # 7. CAPTURE REASONING
            reasoning_text = data.get("reasoning", "Analyzed target users and mapped optimal conversion paths.")
            ux_reasoning = AgentReasoning(
                agent_name="UX Designer",
                thought=reasoning_text,
                certainty=0.85
            )
            state.agent_reasoning.append(ux_reasoning)

            persona_name = data.get("primary_persona", {}).get("name", "User")
            state.logs.append(f"UX Agent: Persona defined - '{persona_name}' with {len(data.get('conversion_points', []))} conversion points.")
            print(f"[UX] Persona: {persona_name}, Journey: {len(state.ux_strategy.get('user_journey', []))} stages")
        else:
            raise ValueError("Invalid JSON structure returned")

    except Exception as e:
        error_msg = f"UX Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent crash
        if not state.ux_strategy:
            state.ux_strategy = {
                "primary_persona": {"name": "General User", "pain_points": ["Needs information"]},
                "user_journey": ["Visit site", "Browse content", "Contact"],
                "conversion_points": ["Contact Form"]
            }

    # 6. Final Terminal Log
    log_agent_action("UX Agent", filled_prompt, full_response)
