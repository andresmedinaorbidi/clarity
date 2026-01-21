import json
from utils import get_filled_prompt, ask_gemini, log_agent_action
from state_schema import WebsiteState

def run_intake_agent(state: WebsiteState) -> WebsiteState:
    # 1. Prepare Data for Gemini
    state_dict = state.model_dump()
    state_dict['format_instructions'] = "Return ONLY a plain JSON list of strings. Do not return a dictionary. Example: ['Industry', 'Brand Motto']"

    # Pass assumptions to the prompt so Auditor knows what was inferred
    assumptions_list = state.project_meta.get("assumptions", [])
    state_dict['assumptions'] = ", ".join(assumptions_list) if assumptions_list else "None"
    
    # Pass inferred_fields to the prompt so Auditor doesn't mark them as missing
    inferred_fields = state.project_meta.get("inferred_fields", [])
    state_dict['inferred_fields'] = ", ".join(inferred_fields) if inferred_fields else "None"

    # 2. Get the prompt (Make sure your prompts/intake_agent.txt is updated to use these variables)
    filled_prompt = get_filled_prompt("intake_agent", state_dict)
    
    # 3. Ask Gemini
    ai_response = ask_gemini(filled_prompt, json_mode=True)

    try:
        data = json.loads(ai_response)
        
        # SAFETY CHECK: Extract the list even if Gemini returns a dictionary
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list):
                    missing = value
                    break
            else:
                missing = [] 
        else:
            missing = data 

        # Filter out inferred fields from missing info
        inferred_fields = state.project_meta.get("inferred_fields", [])
        # Convert inferred_fields to field names that match missing_info format
        inferred_field_names = []
        for field in inferred_fields:
            # Map actual field names to user-friendly names
            if field == "project_name":
                inferred_field_names.extend(["project_name", "Project Name", "Business Name"])
            elif field == "industry":
                inferred_field_names.extend(["industry", "Industry"])
            elif field == "brand_colors":
                inferred_field_names.extend(["brand_colors", "Brand Colors", "Colors"])
            elif field == "design_style":
                inferred_field_names.extend(["design_style", "Design Style", "Style"])
        
        # Filter missing info to exclude inferred fields
        filtered_missing = [
            item for item in missing 
            if str(item) not in inferred_field_names and str(item).lower() not in [f.lower() for f in inferred_field_names]
        ]
        
        # Update the missing_info list
        state.missing_info = [str(item) for item in filtered_missing]

    except Exception as e:
        state.logs.append(f"Intake Agent: Error parsing AI response: {str(e)}")
        # We don't clear missing_info on error to avoid accidentally "skipping" the intake
        
    # 4. Logging (Internal thoughts)
    if not state.missing_info:
        state.logs.append("Intake Agent Audit: All essential information is present.")
    else:
        state.logs.append(f"Intake Agent Audit: Still waiting for: {state.missing_info}")

    # 5. Output to Terminal
    log_agent_action("Intake Agent", filled_prompt, ai_response)
    
    return state