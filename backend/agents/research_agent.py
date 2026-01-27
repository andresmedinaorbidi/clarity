# backend/agents/research_agent.py
"""
Research Agent - The "Magic" Discovery Agent

This agent automatically researches a business when a URL or project name is provided.
It uses web scraping (when available) combined with Gemini to generate a Discovery Report
that informs all downstream agents with industry insights and brand intelligence.
"""

import json
from typing import Optional
from utils import get_filled_prompt, stream_gemini, ask_gemini, log_agent_action
from utils_scraper import scrape_url, extract_url_from_text, generate_mock_research, is_valid_url, normalize_url
from state_schema import WebsiteState, AgentReasoning
from services.field_mapper import map_to_closest_option
from services.visual_generator import generate_field_visuals


def run_research_agent(state: WebsiteState, url: Optional[str] = None, feedback: str = None):
    """
    Research Agent: Discovers business information through web scraping and AI analysis.

    This agent:
    1. Attempts to scrape the provided URL (if any)
    2. Uses Gemini to analyze scraped content OR generate insights from business name
    3. Produces a structured Discovery Report
    4. Saves findings to state.additional_context["research_data"]

    Args:
        state: Current WebsiteState
        url: Optional URL to scrape (can also be extracted from state or feedback)
        feedback: Optional feedback for re-running research

    Yields:
        Status messages during research process
    """
    yield " 🔬 **Researching your business...** \n\n"

    project_name = state.project_name
    industry = state.industry

    # Try to find a URL if not provided
    if not url:
        # Check if there's a URL in additional_context
        url = state.additional_context.get("business_url")

    if not url and feedback:
        # Try to extract URL from feedback
        url = extract_url_from_text(feedback)

    # Log what we're researching
    if url:
        state.logs.append(f"Research Agent: Analyzing URL - {url}")
        print(f"[RESEARCH] Scraping URL: {url}")
        yield f"Analyzing website: {url}\n\n"
    else:
        state.logs.append(f"Research Agent: Generating insights for '{project_name}'")
        print(f"[RESEARCH] No URL - using AI inference for: {project_name}")
        yield f"Generating market insights for: {project_name}\n\n"

    # Phase 1: Gather raw data
    scraped_content = None
    scrape_result = None

    if url:
        # Normalize URL before validation and scraping
        normalized_url = normalize_url(url) if not url.startswith(('http://', 'https://')) else url
        
        if is_valid_url(normalized_url):
            scrape_result = scrape_url(normalized_url)
            if scrape_result.get("success"):
                scraped_content = scrape_result.get("content", "")
                page_title = scrape_result.get("title", "")
                meta_desc = scrape_result.get("meta_description", "")

                yield f"Found: **{page_title}**\n"
                if meta_desc:
                    yield f"_{meta_desc[:100]}..._\n\n"

                # Extract business name from page title if not provided
                if not project_name and page_title:
                    # Try to extract business name from title (remove common suffixes)
                    title_clean = page_title.split('|')[0].split('-')[0].strip()
                    if len(title_clean) > 3 and len(title_clean) < 50:
                        state.project_name = title_clean
                        state.logs.append(f"Research Agent: Extracted business name from page title: {title_clean}")
                        print(f"[RESEARCH] Extracted business name: {title_clean}")

                print(f"[RESEARCH] Scraped {len(scraped_content)} chars from {normalized_url}")
        else:
            error = scrape_result.get("error", "Unknown error")
            state.logs.append(f"Research Agent: Scraping failed - {error}")
            print(f"[RESEARCH] Scrape failed: {error}")
            yield f"Could not access website ({error}). Using AI analysis instead.\n\n"

    # Phase 2: AI Analysis
    yield "Synthesizing discovery report...\n\n"

    try:
        if scraped_content:
            # Use Gemini to analyze scraped content
            research_data = _analyze_with_gemini(
                project_name=project_name,
                industry=industry,
                scraped_content=scraped_content,
                page_title=scrape_result.get("title", ""),
                meta_description=scrape_result.get("meta_description", "")
            )
            research_data["source"] = "web_scrape"
            research_data["source_url"] = url
        else:
            # Use Gemini to infer from business name and industry
            if project_name:
                research_data = _infer_with_gemini(
                    project_name=project_name,
                    industry=industry
                )
                research_data["source"] = "ai_inference"
            else:
                # Fallback to mock data
                research_data = generate_mock_research(project_name or "Business", industry)
                research_data["source"] = "mock_fallback"

    except Exception as e:
        print(f"[RESEARCH] Gemini analysis failed: {str(e)}")
        state.logs.append(f"Research Agent: AI analysis failed - {str(e)}")
        # Fallback to mock
        research_data = generate_mock_research(project_name or "Business", industry)
        research_data["source"] = "mock_fallback"
        research_data["error"] = str(e)

    # Phase 3: Save to state
    state.additional_context["research_data"] = research_data

    # Ensure project_meta structure
    if "field_mappings" not in state.project_meta:
        state.project_meta["field_mappings"] = {}
    if "field_visuals" not in state.project_meta:
        state.project_meta["field_visuals"] = {}

    # Build context for mapping/visual generation
    context = f"Business: {state.project_name}, Industry: {state.industry}"

    # Phase 3.5: Map and generate visuals for inferred values
    # Handle industry
    if research_data.get("inferred_industry"):
        inferred_industry = research_data["inferred_industry"]
        if not state.industry:
            # Attempt mapping
            industry_options = [
                {"value": "technology", "label": "Technology", "description": "Software, SaaS, IT services"},
                {"value": "ecommerce", "label": "E-commerce", "description": "Online retail, marketplaces"},
                {"value": "healthcare", "label": "Healthcare", "description": "Medical, wellness, fitness"},
                {"value": "finance", "label": "Finance", "description": "Banking, fintech, insurance"},
                {"value": "education", "label": "Education", "description": "Schools, courses, e-learning"},
                {"value": "restaurant", "label": "Restaurant", "description": "Food service, cafes, bars"},
                {"value": "real_estate", "label": "Real Estate", "description": "Properties, agencies"},
                {"value": "professional_services", "label": "Professional Services", "description": "Legal, consulting, agencies"},
                {"value": "creative", "label": "Creative", "description": "Design, photography, art"},
                {"value": "nonprofit", "label": "Nonprofit", "description": "Charities, foundations"},
                {"value": "other", "label": "Other", "description": "Something else"},
            ]
            try:
                mapping = map_to_closest_option("industry", inferred_industry, industry_options, context)
                if mapping.get("mapped_value") and mapping.get("confidence", 0) >= 0.7:
                    state.industry = mapping["mapped_value"]
                    state.project_meta["field_mappings"]["industry"] = mapping
                else:
                    state.industry = inferred_industry
                    # Generate visuals for unmatched
                    visuals = generate_field_visuals("industry", inferred_industry, "industry", context)
                    state.project_meta["field_visuals"]["industry"] = visuals
                state.project_meta.setdefault("inferred_fields", []).append("industry")
            except Exception as e:
                print(f"[Research] Mapping/visual generation failed for industry: {str(e)}")
                state.industry = inferred_industry
                state.project_meta.setdefault("inferred_fields", []).append("industry")

    # Handle brand colors
    if research_data.get("suggested_color_palette") and not state.brand_colors:
        state.brand_colors = research_data["suggested_color_palette"][:3]  # Take top 3
        state.project_meta.setdefault("inferred_fields", []).append("brand_colors")

    # Store key services if found
    if research_data.get("key_services"):
        state.project_meta["key_services"] = research_data["key_services"]

    # Store target audience insight
    if research_data.get("target_audience"):
        state.project_meta["target_audience_insight"] = research_data["target_audience"]

    state.logs.append(f"Research Agent: Discovery complete (source: {research_data.get('source', 'unknown')})")

    # Phase 4: Capture reasoning
    reasoning = AgentReasoning(
        agent_name="Researcher",
        thought=f"Analyzed {research_data.get('source', 'available data')} to discover brand personality, services, and market positioning for {project_name}.",
        certainty=0.85 if research_data.get("source") == "web_scrape" else 0.70
    )
    state.agent_reasoning.append(reasoning)

    # Log the action
    log_agent_action("Research Agent", f"Project: {project_name}, URL: {url}", json.dumps(research_data, indent=2))

    print(f"[RESEARCH] Complete. Source: {research_data.get('source')}")


def _analyze_with_gemini(
    project_name: str,
    industry: str,
    scraped_content: str,
    page_title: str,
    meta_description: str
) -> dict:
    """
    Use Gemini to analyze scraped web content and generate a Discovery Report.
    """
    prompt = f"""You are a Business Intelligence Analyst. Analyze the following website content and generate a Discovery Report.

### WEBSITE DATA:
- Page Title: {page_title}
- Meta Description: {meta_description}
- Business Name: {project_name or "Unknown"}
- Stated Industry: {industry or "Not specified"}

### WEBSITE CONTENT:
{scraped_content[:6000]}

### YOUR TASK:
Analyze this content and extract key business intelligence. Return ONLY a valid JSON object with this exact structure:

{{
  "inferred_industry": "The specific industry/niche this business operates in",
  "brand_personality": "A 2-3 sentence description of the brand's personality, tone, and values",
  "key_services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "target_audience": "A description of who this business serves (demographics, needs, pain points)",
  "suggested_color_palette": ["Color 1", "Color 2", "Color 3", "Color 4"],
  "unique_value_proposition": "What makes this business different from competitors",
  "market_trends": ["Trend 1 relevant to this industry", "Trend 2", "Trend 3"],
  "competitors": ["Likely competitor 1", "Likely competitor 2"],
  "content_themes": ["Theme 1 from website", "Theme 2", "Theme 3"]
}}

Be specific and insightful. Base your analysis on the actual content provided.
Return ONLY the JSON object, no additional text."""

    try:
        response = ask_gemini(prompt, json_mode=True)

        # Clean and parse response
        clean_json = response.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        clean_json = clean_json.strip()

        return json.loads(clean_json)

    except Exception as e:
        print(f"[RESEARCH] Gemini parse error: {str(e)}")
        # Return a basic structure on failure
        return {
            "inferred_industry": industry or "General Business",
            "brand_personality": f"Professional business focused on delivering value",
            "key_services": ["Primary service", "Secondary service"],
            "target_audience": "Customers seeking quality solutions",
            "suggested_color_palette": ["Blue", "White", "Gray"],
            "parse_error": str(e)
        }


def _infer_with_gemini(project_name: str, industry: str) -> dict:
    """
    Use Gemini to infer business details from just the name and industry.
    This is the "magic" that makes the system feel intelligent.
    """
    prompt = f"""You are a Business Intelligence Analyst with expertise in branding and market research.

### BUSINESS INFORMATION:
- Business Name: {project_name}
- Industry Hint: {industry or "Not specified"}

### YOUR TASK:
Based on the business name and any industry hints, infer likely details about this business.
Use your knowledge of naming conventions, industry patterns, and market trends.

Return ONLY a valid JSON object with this exact structure:

{{
  "inferred_industry": "Your best guess at the specific industry/niche",
  "brand_personality": "A 2-3 sentence description of the likely brand personality based on the name",
  "key_services": ["Likely service 1", "Likely service 2", "Likely service 3"],
  "target_audience": "Who this business likely serves based on name and industry",
  "suggested_color_palette": ["Color 1", "Color 2", "Color 3", "Color 4"],
  "unique_value_proposition": "What the name suggests about their differentiation",
  "market_trends": ["Relevant trend 1", "Relevant trend 2", "Relevant trend 3"],
  "competitors": ["Typical competitor type 1", "Typical competitor type 2"],
  "name_analysis": "Brief analysis of what the business name conveys"
}}

Be creative but realistic. Think like a brand strategist.
Return ONLY the JSON object, no additional text."""

    try:
        response = ask_gemini(prompt, json_mode=True)

        # Clean and parse response
        clean_json = response.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        clean_json = clean_json.strip()

        return json.loads(clean_json)

    except Exception as e:
        print(f"[RESEARCH] Gemini inference error: {str(e)}")
        # Return mock data on failure
        return generate_mock_research(project_name, industry)


def has_research_data(state: WebsiteState) -> bool:
    """Check if research has already been performed for this state."""
    return bool(state.additional_context.get("research_data"))


def should_run_research(state: WebsiteState, user_message: str = "") -> bool:
    """
    Determine if research should be triggered.

    Returns True if:
    - We have a project name but no research data yet
    - A URL is detected in the user message
    - User explicitly asks to research
    """
    # Already have research
    if has_research_data(state):
        return False

    # Check for URL in message
    if extract_url_from_text(user_message):
        return True

    # Have project name but no research yet
    if state.project_name and not has_research_data(state):
        return True

    return False
