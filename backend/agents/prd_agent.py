# backend/agents/prd_agent.py
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState

def run_prd_agent(state: WebsiteState, feedback: str = None):
    """
    Technical Worker: Generates or revises the Technical PRD.
    Yields chunks of Markdown text to the chat in real-time.
    """
    # 1. Determine the logical instruction and context
    if feedback and state.prd_document:
        # Revision Mode
        instruction = f"REVISE the existing Technical PRD based on this specific user feedback: '{feedback}'."
        context_data = f"### CURRENT DOCUMENT TO EDIT:\n{state.prd_document}"
        state.logs.append(f"PRD Agent: Starting revision with feedback: {feedback}")
    else:
        # Creation Mode
        instruction = "Create a comprehensive Technical PRD (Product Requirements Document) based on the sitemap."
        context_data = f"### SITEMAP BASIS:\n{state.sitemap}"
        state.logs.append("PRD Agent: Starting initial PRD generation.")

    # 2. Prepare data dictionary (Matching the {variables} in prd_agent.txt)
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['context_data'] = context_data
    state_dict['format_instructions'] = "Return the PRD as a clean Markdown string. Do not use JSON."

    # 3. Load the EXTERNAL prompt file
    filled_prompt = get_filled_prompt("prd_agent", state_dict)
    
    # 4. START THE STREAM
    yield " 📝  Writing technical specifications... \n\n"
    
    full_response = ""
    
    # We use stream_gemini with json_mode=False because we want Markdown
    for chunk in stream_gemini(filled_prompt, json_mode=False):
        full_response += chunk
        # WE YIELD EACH CHUNK so it appears in the chat bubble word-by-word
        yield chunk 

    # 5. SAVE FINAL RESULT
    state.prd_document = full_response
    state.logs.append("PRD Agent: Technical document task completed.")

    # 6. Terminal Log
    log_agent_action("PRD Agent", filled_prompt, full_response)