import os
import json
import re
from google import genai
from dotenv import load_dotenv
from typing import Any

load_dotenv()

# Setup the Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def ask_gemini(prompt: str, json_mode: bool = False) -> str:
    """Sends a prompt to Gemini and returns the response."""
    config = None
    if json_mode:
        config = {"response_mime_type": "application/json"}

    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt,
        config=config
    )
    return response.text

def load_prompt(agent_name: str) -> str:
    file_path = f"prompts/{agent_name}.txt"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return "Prompt file not found."

def get_filled_prompt(agent_name: str, state_dict: dict) -> str:
    raw_template = load_prompt(agent_name)
    
    # Extract all {variable} placeholders from template
    # IMPORTANT: Only match {var} that is NOT already escaped (not {{var}})
    # Match {var} but not {{var}} - use negative lookbehind and lookahead
    template_vars = set(re.findall(r'(?<!\{)\{(\w+)\}(?!\})', raw_template))
    
    # Convert complex objects to safe string representations
    # This prevents format patterns in dict/list string representations from being interpreted
    # CRITICAL: Escape braces in ALL string values used in templates to prevent format interpretation
    safe_dict = {}
    for k, v in state_dict.items():
        try:
            if isinstance(v, (dict, list)):
                # Convert complex objects to JSON strings (JSON doesn't use Python's {key} format)
                # Use ensure_ascii=True to avoid \u escape sequences that cause regex issues
                safe_dict[k] = json.dumps(v, ensure_ascii=True) if v else (json.dumps([]) if isinstance(v, list) else json.dumps({}))
            elif isinstance(v, str) and k in template_vars:
                # For ALL string values used in template, escape braces to prevent format interpretation
                # This is necessary because values might contain format patterns from AI responses
                safe_dict[k] = v.replace("{", "{{").replace("}", "}}")
            else:
                safe_dict[k] = v
        except Exception as e:
            # If JSON serialization fails, use a safe fallback
            print(f"[!] Error serializing {k} for prompt: {str(e)}")
            safe_dict[k] = str(v) if v else ""
    
    try:
        # Use regex-based replacement but with proper escaping
        # This prevents any format patterns in values from being interpreted as placeholders
        result = raw_template
        for var_name in template_vars:
            if var_name in safe_dict:
                # Use regex to replace {var_name} but not {{var_name}} (already escaped)
                # Pattern: {var_name} that is not preceded by { and not followed by }
                pattern = r'(?<!\{)\{' + re.escape(var_name) + r'\}(?!\})'
                replacement = str(safe_dict[var_name])
                # Use a lambda to avoid regex escape sequence issues in replacement
                result = re.sub(pattern, lambda m: replacement, result)
        
        return result
    except Exception as e:
        # Log the error but don't send error message to AI - use a fallback prompt
        print(f"[!] Prompt filling error for {agent_name}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return a minimal valid prompt instead of an error message
        return f"Generate a response based on the following context. Error occurred during prompt preparation: {str(e)[:100]}"

def log_agent_action(agent_name: str, input_prompt: str, output: Any):
    try:
        print(f"\n--- [AI AGENT] {agent_name.upper()} ---")
        print(f"INPUT SENT TO GEMINI: \n{input_prompt}")
        print(f"\nGEMINI RESPONSE: \n{output}")
        print(f"------------------------------\n")
    except UnicodeEncodeError:
        # Fallback for Windows console encoding issues
        print(f"\n--- [AI AGENT] {agent_name.upper()} ---")
        print(f"INPUT SENT (encoding issue)")
        print(f"RESPONSE RECEIVED")
        print(f"------------------------------\n")

def stream_gemini(
    prompt: str,
    json_mode: bool = False,
    model_type: str = "default"  # default | flash | pro
):
    """
    Model selection:
    - default -> gemini-2.5-flash (general creation)
    - flash    -> gemini-2.0-flash (super fast chat)
    - pro     -> gemini-2.5-pro   (code generation)
    """

    MODEL_MAP = {
        "default": "gemini-2.5-flash",
        "flash": "gemini-2.0-flash",
        "pro": "gemini-3-flash-preview",
    }

    model_id = MODEL_MAP.get(model_type, MODEL_MAP["default"])
    config = {"response_mime_type": "application/json"} if json_mode else None

    try:
        response = client.models.generate_content_stream(
            model=model_id,
            contents=prompt,
            config=config
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    except Exception as e:
        yield f" [Error: {str(e)}] "

def summarize_project_context(state) -> str:
    """
    Compresses chat history and logs into a concise project context summary.
    Uses Gemini Flash for fast summarization.

    Args:
        state: WebsiteState object containing chat_history and logs

    Returns:
        str: A concise 1-paragraph summary of the project context
    """
    # Extract chat messages for summarization
    chat_messages = []
    for msg in state.chat_history:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        chat_messages.append(f"{role.upper()}: {content}")

    chat_text = "\n".join(chat_messages)
    logs_text = "\n".join(state.logs[-10:])  # Last 10 logs only

    # Create the summarization prompt
    summary_prompt = f"""You are a Memory Compression Agent. Your job is to create a concise, information-dense summary of a web design project conversation.

PROJECT CONTEXT:
- Business Name: {state.project_name}
- Industry: {state.industry}
- Design Style: {state.design_style}
- Brand Colors: {state.brand_colors}
- Current Step: {state.current_step}

CONVERSATION HISTORY:
{chat_text}

RECENT SYSTEM LOGS:
{logs_text}

YOUR TASK:
Create a single, dense paragraph (3-5 sentences) that captures:
1. What the project is (business name, industry, purpose)
2. Key design decisions made (style, colors, preferences)
3. Current progress state (what's been completed, what's next)
4. Any critical user preferences or constraints mentioned

Be factual and concise. Focus on decisions and facts, not pleasantries.
Write in third person (e.g., "The user is building...").

OUTPUT ONLY THE SUMMARY PARAGRAPH. NO PREAMBLE."""

    try:
        summary = ask_gemini(summary_prompt, json_mode=False)
        return summary.strip()
    except Exception as e:
        return f"[Summary generation failed: {str(e)}]"
