import os
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
    try:
        # We use .get() to avoid errors if a variable is missing
        return raw_template.format(**state_dict)
    except KeyError as e:
        return f"Error: Missing variable {e}"

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
