# backend/agents/builder_agent.py
import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

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

    # 3. Format specialist data as readable JSON for the prompt
    state_dict['seo_data'] = json.dumps(state.seo_data, indent=2) if state.seo_data else "No SEO data available"
    state_dict['copywriting'] = json.dumps(state.copywriting, indent=2) if state.copywriting else "No copywriting data available"
    state_dict['ux_strategy'] = json.dumps(state.ux_strategy, indent=2) if state.ux_strategy else "No UX strategy available"
    state_dict['project_meta'] = json.dumps(state.project_meta, indent=2) if state.project_meta else "No business strategy available"

    # 4. Load External Prompt
    filled_prompt = get_filled_prompt("builder_agent", state_dict)

    # 5. START THE STREAM
    yield "🚀 **Compiling code and rendering preview...** \n\n"
    
    full_code = ""
    for chunk in stream_gemini(filled_prompt, json_mode=False, model_type="pro"):
        full_code += chunk
        # Note: We don't usually stream the raw code to the CHAT bubble 
        # (it looks messy), but we yield it so the Router can catch it.
        yield "" 

    # 6. Clean and Save
    # We use the same 'Triple-Strip' logic to remove ```html tags
    clean_code = full_code.strip()
    if "```html" in clean_code:
        clean_code = clean_code.split("```html")[1].split("```")[0].strip()
    elif "```" in clean_code:
        clean_code = clean_code.split("```")[1].split("```")[0].strip()

    state.generated_code = clean_code
    state.logs.append("Builder Agent: Website code generated.")

    # 7. CAPTURE REASONING
    # Summarize what data sources the builder used
    data_sources = []
    if state.seo_data:
        data_sources.append("SEO keywords and meta tags")
    if state.copywriting:
        data_sources.append("marketing copy and CTAs")
    if state.ux_strategy:
        data_sources.append("UX personas and conversion strategy")
    if state.project_meta:
        data_sources.append("business goals and brand positioning")
    if state.prd_document:
        data_sources.append("technical PRD specifications")

    sources_text = ", ".join(data_sources) if data_sources else "project requirements"

    reasoning_text = f"Generated production-ready HTML/Tailwind code implementing {sources_text}. Ensured responsive design, accessibility, and conversion optimization."

    builder_reasoning = AgentReasoning(
        agent_name="Code Builder",
        thought=reasoning_text,
        certainty=0.90
    )
    state.agent_reasoning.append(builder_reasoning)

    log_agent_action("Builder", filled_prompt, "Code Generated Successfully")