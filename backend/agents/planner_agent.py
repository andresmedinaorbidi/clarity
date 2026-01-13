import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState

def run_planner_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Generates or revises sitemaps using streaming.
    Yields status updates but does not show raw JSON to the user.
    """
    # 1. Determine the logical instruction
    if feedback:
        instruction = f"REVISE the existing sitemap {state.sitemap} based on this user feedback: '{feedback}'."
        state.logs.append(f"Planner Agent: Starting revision with feedback: {feedback}")
    else:
        instruction = "Create a strategic sitemap of 4-5 essential pages for this business."
        state.logs.append("Planner Agent: Starting initial sitemap generation.")

    # 2. Prepare data for the external prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = "Return ONLY a plain JSON list of strings. Example: ['Home', 'About', 'Services', 'Contact']"

    # 3. Load and fill the external prompt file (planner_agent.txt)
    filled_prompt = get_filled_prompt("planner_agent", state_dict)
    
    # 4. START THE STREAM
    # We yield a status message so the user knows the "Architect" is working
    yield " 🏗️  Architecting your sitemap structure... "
    
    full_response = ""
    
    # We use the stream_gemini helper from utils.py
    # json_mode=True ensures Gemini tries to output valid JSON
    try:
        for chunk in stream_gemini(filled_prompt, json_mode=True):
            full_response += chunk
            # We yield an empty string to keep the connection alive without 
            # showing raw JSON code to the user in the chat bubble.
            yield "" 

        # 5. PROCESS THE RESULT
        # Clean the response: sometimes Gemini adds markdown code blocks even in JSON mode
        clean_json = full_response.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[-1].rsplit("\n", 1)[0].strip()
        if clean_json.startswith("json"):
            clean_json = clean_json[4:].strip()

        data = json.loads(clean_json)

        # Robust Parsing: Handle if it returns {"sitemap": [...]} or just [...]
        sitemap_result = []
        if isinstance(data, list):
            sitemap_result = data
        elif isinstance(data, dict):
            # Find the first list in the dictionary
            for value in data.values():
                if isinstance(value, list):
                    sitemap_result = value
                    break
        
        if sitemap_result:
            state.sitemap = [str(page) for page in sitemap_result]
            state.logs.append(f"Planner Agent: Successfully updated sitemap: {state.sitemap}")
        else:
            raise ValueError("No list found in AI response")

    except Exception as e:
        error_msg = f"Planner Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent app crash
        if not state.sitemap:
            state.sitemap = ["Home", "About", "Services", "Contact"]

    # 6. Final Terminal Log
    log_agent_action("Planner Agent", filled_prompt, full_response)