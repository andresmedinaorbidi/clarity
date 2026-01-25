# backend/services/enrich_service.py
"""
Enrichment service for the /enrich endpoint.
PR-03: Runs scraper + LLM inference to prefill project defaults.

Stores inferred values in state.project_meta["inferred"] and updates
active fields ONLY if not overridden by user.
"""

import json
from typing import Optional, Dict, Any

from state_schema import WebsiteState
from utils import get_filled_prompt, ask_gemini
from services.scraper_service import scrape_website


def run_enrichment(
    state: WebsiteState,
    seed_text: str,
    website_url: Optional[str] = None,
    force: bool = False
) -> WebsiteState:
    """
    Run scraper + LLM enrichment based on seed text and optional website URL.

    - Runs scraper if website_url provided (2s timeout)
    - Runs Gemini with enrich_agent prompt in JSON mode
    - Merges inferred fields into state.project_meta["inferred"]
    - Updates active fields (industry, design_style, brand_colors) ONLY if not user-overridden
    - Stores scrape summary in additional_context (optional)
    - Adds log lines for success/failure
    - NEVER throws; always returns state

    Args:
        state: Current WebsiteState
        seed_text: User's initial input (hero text)
        website_url: Optional website URL to scrape
        force: If True, run enrichment even if already enriched (default False)

    Returns:
        Updated WebsiteState with inferred values
    """
    # Ensure project_meta has required structure (PR-02)
    _ensure_project_meta_structure(state)

    # Check if already enriched (skip if not forced)
    if not force and state.project_meta.get("inferred") and len(state.project_meta["inferred"]) > 0:
        state.logs.append("Enrich: Skipped (already enriched, use force=true to re-run)")
        return state

    state.logs.append(f"Enrich: Starting enrichment for seed: '{seed_text[:50]}...'")

    # Step 1: Scrape website if URL provided
    scrape_result = None
    if website_url:
        state.logs.append(f"Enrich: Scraping website: {website_url}")
        try:
            scrape_result = scrape_website(website_url, timeout_seconds=2.0)
            if scrape_result.get("error"):
                state.logs.append(f"Enrich: Scrape warning - {scrape_result['error']}")
            else:
                state.logs.append(f"Enrich: Scraped successfully - title: {scrape_result.get('title', 'N/A')}")
                # Store scrape summary in additional_context
                state.additional_context["scrape_summary"] = {
                    "url": scrape_result.get("final_url"),
                    "title": scrape_result.get("title"),
                    "meta_description": scrape_result.get("meta_description"),
                    "h1": scrape_result.get("h1"),
                }
        except Exception as e:
            state.logs.append(f"Enrich: Scraper error - {str(e)[:100]}")
            scrape_result = {"error": str(e), "url": website_url}

    # Step 2: Run LLM inference
    state.logs.append("Enrich: Running LLM inference...")
    try:
        inferred_data = _run_llm_inference(state, seed_text, website_url, scrape_result)

        if inferred_data and "inferred" in inferred_data:
            state.logs.append("Enrich: LLM inference successful")
            # Merge inferred values into state
            _merge_inferred_values(state, inferred_data["inferred"])
        else:
            state.logs.append("Enrich: LLM returned no inferred data")

    except Exception as e:
        state.logs.append(f"Enrich error: LLM inference failed - {str(e)[:100]}")

    state.logs.append("Enrich: Complete")
    return state


def _ensure_project_meta_structure(state: WebsiteState) -> None:
    """Ensure project_meta has inferred and user_overrides dicts."""
    if not isinstance(state.project_meta, dict):
        state.project_meta = {}
    if "inferred" not in state.project_meta:
        state.project_meta["inferred"] = {}
    if "user_overrides" not in state.project_meta:
        state.project_meta["user_overrides"] = {}


def _run_llm_inference(
    state: WebsiteState,
    seed_text: str,
    website_url: Optional[str],
    scrape_result: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Run Gemini with enrich_agent prompt to infer business attributes.

    Returns parsed JSON dict or None if failed.
    """
    # Prepare context for prompt
    scrape_summary = {}
    if scrape_result and not scrape_result.get("error"):
        scrape_summary = {
            "title": scrape_result.get("title"),
            "meta_description": scrape_result.get("meta_description"),
            "h1": scrape_result.get("h1"),
            "text_snippet": scrape_result.get("text_snippet", "")[:300],  # Limit snippet
        }

    # Minimal existing state for context
    existing_state = {
        "project_name": state.project_name,
        "industry": state.industry,
        "design_style": state.design_style,
        "brand_colors": state.brand_colors,
    }

    # Build prompt variables
    prompt_vars = {
        "seed_text": seed_text,
        "website_url": website_url or "not provided",
        "scrape_summary_json": json.dumps(scrape_summary, ensure_ascii=True),
        "existing_state_json": json.dumps(existing_state, ensure_ascii=True),
    }

    # Get filled prompt
    prompt = get_filled_prompt("enrich_agent", prompt_vars)

    # Call Gemini in JSON mode
    try:
        response = ask_gemini(prompt, json_mode=True)
        # Parse JSON response
        result = json.loads(response)
        return result
    except json.JSONDecodeError as e:
        print(f"[Enrich] JSON parse error: {e}")
        print(f"[Enrich] Raw response: {response[:500] if response else 'None'}")
        return None
    except Exception as e:
        print(f"[Enrich] LLM error: {e}")
        return None


def _merge_inferred_values(state: WebsiteState, inferred: Dict[str, Any]) -> None:
    """
    Merge inferred values into state.

    - Stores all inferred values in state.project_meta["inferred"]
    - Updates active fields ONLY if NOT in user_overrides
    """
    user_overrides = state.project_meta.get("user_overrides", {})

    for field_name, field_data in inferred.items():
        # Always store in project_meta["inferred"]
        state.project_meta["inferred"][field_name] = field_data

        # Check if user has overridden this field
        if field_name in user_overrides:
            print(f"[Enrich] Field '{field_name}' is user-overridden, skipping active update")
            continue

        # Update active field if applicable
        value = field_data.get("value") if isinstance(field_data, dict) else field_data

        if field_name == "industry" and value:
            state.industry = str(value)

        elif field_name == "design_style" and value:
            state.design_style = str(value)

        elif field_name == "brand_colors" and value:
            if isinstance(value, list):
                state.brand_colors = [str(c) for c in value]
            elif isinstance(value, str):
                # Handle comma-separated string
                state.brand_colors = [c.strip() for c in value.split(",")]

        elif field_name == "draft_pages" and value:
            # Store in additional_context, not as active field
            if isinstance(value, list):
                state.additional_context["draft_pages"] = value

        elif field_name == "tone" and value:
            # Store tone in project_meta for later use
            state.project_meta["tone"] = str(value)
