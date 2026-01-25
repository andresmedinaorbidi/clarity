# backend/services/enrich_service.py
"""
Enrichment service for the /enrich endpoint.
PR-03: Runs scraper + LLM inference to prefill project defaults.
PR-05: Safe rerun support with confidence-based upgrade rules.

Stores inferred values in state.project_meta["inferred"] and updates
active fields ONLY if not overridden by user.

Merge rules (PR-05):
- User overrides are NEVER touched
- Inferred fields upgrade only if new_confidence > old_confidence
- Active fields update only when NOT overridden AND inference was accepted
"""

import json
from typing import Optional, Dict, Any, Tuple

from state_schema import WebsiteState
from utils import get_filled_prompt, ask_gemini
from services.scraper_service import scrape_website


def _coerce_confidence(value: Any) -> float:
    """
    Safely coerce a value to a confidence float in [0.0, 1.0].
    Returns 0.0 for invalid/missing values.
    """
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


def run_enrichment(
    state: WebsiteState,
    seed_text: str,
    website_url: Optional[str] = None,
    force: bool = False
) -> WebsiteState:
    """
    Run scraper + LLM enrichment based on seed text and optional website URL.

    PR-05 enhancements:
    - Skip logic: if force=False, inferred non-empty, and no website_url, skip
    - Confidence upgrade: only replace inferred if new_conf > old_conf
    - Override protection: user overrides are never changed
    - Active field updates: only when not overridden AND inference accepted

    Args:
        state: Current WebsiteState
        seed_text: User's initial input (hero text)
        website_url: Optional website URL to scrape
        force: If True, always rerun enrichment regardless of existing data

    Returns:
        Updated WebsiteState with inferred values (never throws)
    """
    # Ensure project_meta has required structure (PR-02)
    _ensure_project_meta_structure(state)

    # ─────────────────────────────────────────────────────────────────────────
    # Skip logic (PR-05): Skip if already enriched, no force, no new website
    # ─────────────────────────────────────────────────────────────────────────
    existing_inferred = state.project_meta.get("inferred", {})
    has_existing = len(existing_inferred) > 0

    if not force and has_existing and not website_url:
        state.logs.append("Enrich: Skipped (already enriched, no website_url, force=false)")
        return state

    # Log run parameters
    run_mode = "forced" if force else ("rerun with URL" if has_existing else "initial")
    state.logs.append(f"Enrich: Starting ({run_mode}) for seed: '{seed_text[:50]}...'")

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
    """Ensure project_meta and additional_context have required structure (PR-05)."""
    # project_meta structure
    if not isinstance(state.project_meta, dict):
        state.project_meta = {}
    if "inferred" not in state.project_meta:
        state.project_meta["inferred"] = {}
    if "user_overrides" not in state.project_meta:
        state.project_meta["user_overrides"] = {}

    # additional_context structure
    if not isinstance(state.additional_context, dict):
        state.additional_context = {}


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
    Merge inferred values into state with confidence-based upgrade rules (PR-05).

    Algorithm:
    1) For each field in inferred payload:
       - Compare new_confidence vs old_confidence
       - ACCEPT if: field doesn't exist OR new_conf > old_conf (strictly greater)
    2) If ACCEPT:
       - Store in project_meta["inferred"]
       - Update active field ONLY if NOT in user_overrides
    3) If REJECT:
       - Keep existing inferred value
       - Log that we kept the old value

    User overrides are NEVER modified (user intent is final).
    """
    user_overrides = state.project_meta.get("user_overrides", {})
    existing_inferred = state.project_meta.get("inferred", {})

    # Counters for logging
    accepted_count = 0
    upgraded_count = 0
    kept_count = 0

    for field_name, new_data in inferred.items():
        # Normalize new data structure
        if isinstance(new_data, dict):
            new_value = new_data.get("value")
            new_conf = _coerce_confidence(new_data.get("confidence", 0))
            new_source = new_data.get("source", "llm")
            new_rationale = new_data.get("rationale", "")
        else:
            # Handle non-dict values (legacy/simple format)
            new_value = new_data
            new_conf = 0.5  # Default confidence for non-structured data
            new_source = "llm"
            new_rationale = ""

        # Get old inferred data if exists
        old_data = existing_inferred.get(field_name)
        if old_data and isinstance(old_data, dict):
            old_conf = _coerce_confidence(old_data.get("confidence", 0))
        else:
            old_conf = -1.0  # No existing data, will accept new

        # ─────────────────────────────────────────────────────────────────────
        # Upgrade decision: accept only if new > old (strictly greater)
        # ─────────────────────────────────────────────────────────────────────
        accept_new = (old_data is None) or (new_conf > old_conf)

        if not accept_new:
            kept_count += 1
            print(f"[Enrich] Kept existing '{field_name}' (old_conf={old_conf:.2f} >= new_conf={new_conf:.2f})")
            continue

        # Accept new inferred value
        if old_data is None:
            accepted_count += 1
        else:
            upgraded_count += 1
            print(f"[Enrich] Upgraded '{field_name}' (old_conf={old_conf:.2f} -> new_conf={new_conf:.2f})")

        # Store in project_meta["inferred"] with standardized structure
        state.project_meta["inferred"][field_name] = {
            "value": new_value,
            "confidence": new_conf,
            "source": new_source,
            "rationale": new_rationale,
        }

        # ─────────────────────────────────────────────────────────────────────
        # Update active field ONLY if NOT overridden by user
        # ─────────────────────────────────────────────────────────────────────
        if field_name in user_overrides:
            print(f"[Enrich] Field '{field_name}' is user-overridden, skipping active update")
            continue

        # Update active fields based on field name
        if field_name == "industry" and new_value:
            state.industry = str(new_value)

        elif field_name == "design_style" and new_value:
            state.design_style = str(new_value)

        elif field_name == "brand_colors" and new_value:
            if isinstance(new_value, list):
                state.brand_colors = [str(c) for c in new_value]
            elif isinstance(new_value, str):
                # Handle comma-separated string
                state.brand_colors = [c.strip() for c in new_value.split(",")]

        elif field_name == "draft_pages" and new_value:
            # Store in additional_context, not as active field
            # Also check if draft_pages is overridden
            if "draft_pages" not in user_overrides:
                if isinstance(new_value, list):
                    state.additional_context["draft_pages"] = list(new_value)

        elif field_name == "tone" and new_value:
            # Store tone in project_meta for later use (not an active field)
            state.project_meta["tone"] = str(new_value)

    # Log summary
    state.logs.append(f"Enrich: Merged {accepted_count} new, {upgraded_count} upgraded, {kept_count} kept")
