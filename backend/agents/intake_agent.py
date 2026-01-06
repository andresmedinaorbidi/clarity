import json
from utils import get_filled_prompt, ask_gemini, log_agent_action
from state_schema import WebsiteState

def run_intake_agent(state: WebsiteState) -> WebsiteState:
    # 1. Prepare Data for Gemini
    state_dict = state.model_dump()
    state_dict['format_instructions'] = "Return ONLY a plain JSON list of strings. Do not return a dictionary. Example: ['Industry', 'Brand Motto']"
    
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

        # Update the missing_info list
        state.missing_info = [str(item) for item in missing]

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