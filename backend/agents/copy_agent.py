import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_copy_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Generates persuasive marketing copy for all sitemap pages.
    Creates headlines, subheaders, and CTAs based on UX personas and brand positioning.
    Populates state.copywriting with page-specific copy.
    Yields status updates during processing.
    """
    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the marketing copy based on this user feedback: '{feedback}'."
        state.logs.append(f"Copywriter: Refining copy with feedback: {feedback}")
    else:
        instruction = "Write compelling, conversion-focused marketing copy for each page in the sitemap."
        state.logs.append("Copywriter: Generating persuasive headlines and CTAs for all pages.")

    # 2. Prepare data for the prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = """Return ONLY valid JSON with this structure:
{
  "copy_framework": "problem-agitation-solution/before-after-bridge/etc",
  "brand_voice": "professional/friendly/authoritative/playful",
  "page_copy": {
    "Home": {
      "headline": "Primary H1 headline (10-15 words max)",
      "subheadline": "Supporting subheader (15-25 words)",
      "cta_primary": "Main call-to-action text",
      "cta_secondary": "Secondary CTA if applicable",
      "value_props": ["Benefit 1", "Benefit 2", "Benefit 3"]
    }
  },
  "reasoning": "Why this copy framework and voice align with the persona's pain points and business goals"
}"""

    # 3. Load and fill the external prompt file
    filled_prompt = get_filled_prompt("copy_agent", state_dict)

    # 4. START THE STREAM
    yield " ✍️  Copywriter is crafting persuasive messaging... "

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
            # Store in copywriting
            state.copywriting = {
                "copy_framework": data.get("copy_framework", ""),
                "brand_voice": data.get("brand_voice", ""),
                "page_copy": data.get("page_copy", {})
            }

            # 7. CAPTURE REASONING
            reasoning_text = data.get("reasoning", "Crafted copy using persona pain points to drive conversion and engagement.")
            copy_reasoning = AgentReasoning(
                agent_name="Copywriter",
                thought=reasoning_text,
                certainty=0.85
            )
            state.agent_reasoning.append(copy_reasoning)

            page_count = len(data.get("page_copy", {}))
            framework = data.get("copy_framework", "N/A")
            state.logs.append(f"Copywriter: Copy generated - {page_count} pages using '{framework}' framework.")
            print(f"[COPY] Pages: {page_count}, Framework: {framework}, Voice: {data.get('brand_voice', 'N/A')}")
        else:
            raise ValueError("Invalid JSON structure returned")

    except Exception as e:
        error_msg = f"Copywriter Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent crash
        if not state.copywriting:
            state.copywriting = {
                "copy_framework": "value-proposition",
                "brand_voice": "professional",
                "page_copy": {}
            }

    # 6. Final Terminal Log
    log_agent_action("Copywriter", filled_prompt, full_response)
