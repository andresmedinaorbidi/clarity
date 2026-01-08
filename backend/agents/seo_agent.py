import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_seo_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Generates SEO strategy including keywords, meta titles, and meta descriptions.
    Populates state.seo_data with search-optimized content for each page.
    Yields status updates during processing.
    """
    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the SEO strategy based on this user feedback: '{feedback}'."
        state.logs.append(f"SEO Agent: Refining keyword strategy with feedback: {feedback}")
    else:
        instruction = "Generate a comprehensive SEO strategy with keyword research, meta titles, and meta descriptions for all sitemap pages."
        state.logs.append("SEO Agent: Analyzing search intent and generating keyword strategy.")

    # 2. Prepare data for the prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = """Return ONLY valid JSON with this structure:
{
  "primary_keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "secondary_keywords": ["keyword 4", "keyword 5"],
  "search_intent": "informational/transactional/navigational",
  "target_locations": ["location 1", "location 2"],
  "page_seo": {
    "Home": {
      "meta_title": "Title (55-60 chars)",
      "meta_description": "Description (150-160 chars)",
      "focus_keyword": "main keyword",
      "h1_suggestion": "Primary headline"
    }
  },
  "reasoning": "Why these keywords and strategy make sense for this business and target audience"
}"""

    # 3. Load and fill the external prompt file
    filled_prompt = get_filled_prompt("seo_agent", state_dict)

    # 4. START THE STREAM
    yield " 🔍  SEO Specialist is analyzing search intent... "

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
            # Store in seo_data
            state.seo_data = {
                "primary_keywords": data.get("primary_keywords", []),
                "secondary_keywords": data.get("secondary_keywords", []),
                "search_intent": data.get("search_intent", ""),
                "target_locations": data.get("target_locations", []),
                "page_seo": data.get("page_seo", {})
            }

            # 7. CAPTURE REASONING
            reasoning_text = data.get("reasoning", "Analyzed search landscape and identified high-value keywords for target audience.")
            seo_reasoning = AgentReasoning(
                agent_name="SEO Specialist",
                thought=reasoning_text,
                certainty=0.85
            )
            state.agent_reasoning.append(seo_reasoning)

            keyword_count = len(data.get("primary_keywords", []))
            page_count = len(data.get("page_seo", {}))
            state.logs.append(f"SEO Agent: Strategy defined - {keyword_count} primary keywords, {page_count} pages optimized.")
            print(f"[SEO] Keywords: {keyword_count}, Pages: {page_count}, Intent: {data.get('search_intent', 'N/A')}")
        else:
            raise ValueError("Invalid JSON structure returned")

    except Exception as e:
        error_msg = f"SEO Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent crash
        if not state.seo_data:
            state.seo_data = {
                "primary_keywords": ["business", "services"],
                "secondary_keywords": [],
                "search_intent": "informational",
                "page_seo": {}
            }

    # 6. Final Terminal Log
    log_agent_action("SEO Agent", filled_prompt, full_response)
