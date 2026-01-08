import json
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning

def run_planner_agent(state: WebsiteState, feedback: str = None):
    """
    Worker Agent: Generates high-fidelity sitemaps with pages, purposes, and sections.
    Yields status updates but does not show raw JSON to the user.
    """
    # 1. Determine the logical instruction
    if feedback:
        instruction = f"REVISE the existing sitemap based on this user feedback: '{feedback}'. Maintain the high-fidelity structure with title, purpose, and sections for each page."
        state.logs.append(f"Planner Agent: Starting revision with feedback: {feedback}")
    else:
        instruction = "Create a high-fidelity sitemap with 4-6 essential pages. For each page, define its title, purpose, and specific sections."
        state.logs.append("Planner Agent: Starting high-fidelity sitemap generation.")

    # 2. Prepare data for the external prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction
    state_dict['format_instructions'] = '''Return ONLY a JSON array of page objects. Each object must have:
{
  "title": "Page Name",
  "purpose": "Why this page exists (1 sentence)",
  "sections": ["Section 1", "Section 2", "Section 3"]
}

Example:
[
  {
    "title": "Home",
    "purpose": "Introduces the brand and drives visitors to key conversion points",
    "sections": ["Hero", "Value Propositions", "Features Grid", "Testimonials", "CTA"]
  },
  {
    "title": "Services",
    "purpose": "Details service offerings and pricing to help users make purchase decisions",
    "sections": ["Services Overview", "Pricing Table", "FAQ", "Contact CTA"]
  }
]'''

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

        # Robust Parsing: Handle high-fidelity sitemap structure
        sitemap_result = []
        if isinstance(data, list):
            sitemap_result = data
        elif isinstance(data, dict):
            # Find the first list in the dictionary
            for value in data.values():
                if isinstance(value, list):
                    sitemap_result = value
                    break

        if sitemap_result and len(sitemap_result) > 0:
            # Validate structure: Each page should have title, purpose, sections
            validated_sitemap = []
            for page in sitemap_result:
                if isinstance(page, dict):
                    validated_page = {
                        "title": page.get("title", "Untitled Page"),
                        "purpose": page.get("purpose", ""),
                        "sections": page.get("sections", [])
                    }
                    validated_sitemap.append(validated_page)
                elif isinstance(page, str):
                    # Fallback: convert old string format to new structure
                    validated_sitemap.append({
                        "title": page,
                        "purpose": "",
                        "sections": []
                    })

            state.sitemap = validated_sitemap
            page_count = len(validated_sitemap)
            section_count = sum(len(p.get("sections", [])) for p in validated_sitemap)
            state.logs.append(f"Planner Agent: Successfully generated {page_count} pages with {section_count} total sections")
            print(f"[PLANNER] Generated {page_count} pages with {section_count} sections")

            # 6. CAPTURE REASONING
            reasoning_text = f"Designed {page_count} pages aligned with business goals and UX strategy. Each page has specific sections to support the user journey."
            planner_reasoning = AgentReasoning(
                agent_name="Sitemap Architect",
                thought=reasoning_text,
                certainty=0.88
            )
            state.agent_reasoning.append(planner_reasoning)
        else:
            raise ValueError("No valid sitemap structure found in AI response")

    except Exception as e:
        error_msg = f"Planner Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)
        # Fallback to prevent app crash
        if not state.sitemap:
            state.sitemap = [
                {"title": "Home", "purpose": "Main landing page", "sections": ["Hero", "Features", "CTA"]},
                {"title": "About", "purpose": "Company information", "sections": ["Story", "Team"]},
                {"title": "Services", "purpose": "Service offerings", "sections": ["Overview", "Pricing"]},
                {"title": "Contact", "purpose": "Contact information", "sections": ["Form", "Info"]}
            ]

    # 6. Final Terminal Log
    log_agent_action("Planner Agent", filled_prompt, full_response)