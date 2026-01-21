# backend/agents/builder_agent.py
import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_builder_agent(state: WebsiteState, feedback: str = None):
    # #region agent log
    try:
        from datetime import datetime
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Builder agent started", "data": {"has_feedback": bool(feedback), "has_prd": bool(state.prd_document), "has_seo": bool(state.seo_data), "has_copy": bool(state.copywriting)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
    except: pass
    # #endregion
    
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
    
    # #region agent log
    try:
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Starting Gemini stream", "data": {"prompt_length": len(filled_prompt), "prompt_preview": filled_prompt[:200] if len(filled_prompt) > 200 else filled_prompt}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
    except: pass
    # #endregion

    # 5. START THE STREAM
    yield "🚀 **Compiling code and rendering preview...** \n\n"
    
    full_code = ""
    chunk_count = 0
    try:
        for chunk in stream_gemini(filled_prompt, json_mode=False, model_type="pro"):
            full_code += chunk
            chunk_count += 1
            # Note: We don't usually stream the raw code to the CHAT bubble 
            # (it looks messy), but we yield it so the Router can catch it.
            yield "" 
        
        # #region agent log
        try:
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Gemini stream completed", "data": {"chunk_count": chunk_count, "code_length": len(full_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion
    except Exception as e:
        # #region agent log
        try:
            import traceback
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Gemini stream error", "data": {"error": str(e), "traceback": traceback.format_exc()}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion
        raise

    # 6. Clean and Save
    # #region agent log
    try:
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Raw code before cleaning", "data": {"full_code_length": len(full_code), "full_code_preview": full_code[:500]}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "C"}) + "\n")
    except: pass
    # #endregion
    
    # We use improved logic to extract HTML code
    clean_code = full_code.strip()
    
    # Priority 1: Look for ```html code blocks first
    if "```html" in clean_code:
        parts = clean_code.split("```html")
        if len(parts) > 1:
            clean_code = parts[1].split("```")[0].strip()
    # Priority 2: Look for HTML starting with <!DOCTYPE or <html
    elif clean_code.strip().startswith("<!DOCTYPE") or clean_code.strip().startswith("<html"):
        # Already raw HTML, just clean whitespace
        clean_code = clean_code.strip()
    # Priority 3: Look for any code block and check if it's HTML
    elif "```" in clean_code:
        # Find all code blocks
        import re
        code_blocks = re.findall(r'```(?:html)?\s*\n(.*?)```', clean_code, re.DOTALL)
        # Prefer HTML-looking blocks
        html_block = None
        for block in code_blocks:
            block_stripped = block.strip()
            if block_stripped.startswith("<!DOCTYPE") or block_stripped.startswith("<html") or "<div" in block_stripped or "<body" in block_stripped:
                html_block = block_stripped
                break
        if html_block:
            clean_code = html_block
        else:
            # Fallback: use first code block
            clean_code = clean_code.split("```")[1].split("```")[0].strip()
    
    # Final validation: ensure it looks like HTML
    if not (clean_code.startswith("<!DOCTYPE") or clean_code.startswith("<html") or "<div" in clean_code or "<body" in clean_code):
        # #region agent log
        try:
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "WARNING: Cleaned code doesn't look like HTML", "data": {"clean_code_preview": clean_code[:200]}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "C"}) + "\n")
        except: pass
        # #endregion
        # If it doesn't look like HTML, try to find HTML in the original
        if "<!DOCTYPE" in full_code:
            clean_code = full_code.split("<!DOCTYPE")[1]
            if "</html>" in clean_code:
                clean_code = "<!DOCTYPE" + clean_code.split("</html>")[0] + "</html>"
            else:
                clean_code = "<!DOCTYPE" + clean_code
        elif "<html" in full_code:
            html_start = full_code.find("<html")
            html_end = full_code.rfind("</html>")
            if html_end > html_start:
                clean_code = full_code[html_start:html_end + 7]
            else:
                clean_code = full_code[html_start:]

    state.generated_code = clean_code
    state.logs.append("Builder Agent: Website code generated.")
    
    # #region agent log
    try:
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "builder_agent.py:run_builder_agent", "message": "Code saved to state", "data": {"clean_code_length": len(clean_code), "has_code": bool(clean_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
    except: pass
    # #endregion

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