# backend/agents/builder_agent.py
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState

def run_builder_agent(state: WebsiteState, feedback: str = None):
    # 1. Determine instruction
    if feedback:
        instruction = f"Update the existing website code based on this feedback: '{feedback}'."
    else:
        instruction = "Build a complete, professional single-page website based on the PRD."

    # 2. Prepare Data
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    # We tell the AI to use a CDN so it works in an iframe instantly
    state_dict['technical_requirements'] = "Use Tailwind CSS CDN, Lucide Icons, and Google Fonts."

    # 3. Load External Prompt
    filled_prompt = get_filled_prompt("builder_agent", state_dict)
    
    # 4. START THE STREAM
    yield "🚀 **Compiling code and rendering preview...** \n\n"
    
    full_code = ""
    for chunk in stream_gemini(filled_prompt, json_mode=False, model_type="pro"):
        full_code += chunk
        # Note: We don't usually stream the raw code to the CHAT bubble 
        # (it looks messy), but we yield it so the Router can catch it.
        yield "" 

    # 5. Clean and Save
    # We use the same 'Triple-Strip' logic to remove ```html tags
    clean_code = full_code.strip()
    if "```html" in clean_code:
        clean_code = clean_code.split("```html")[1].split("```")[0].strip()
    elif "```" in clean_code:
        clean_code = clean_code.split("```")[1].split("```")[0].strip()

    state.generated_code = clean_code
    state.logs.append("Builder Agent: Website code generated.")
    
    log_agent_action("Builder", filled_prompt, "Code Generated Successfully")