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
from services.field_mapper import map_to_closest_option
from services.visual_generator import generate_field_visuals


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
    if "field_mappings" not in state.project_meta:
        state.project_meta["field_mappings"] = {}
    if "field_visuals" not in state.project_meta:
        state.project_meta["field_visuals"] = {}

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


def _get_predefined_options_for_field(field_name: str) -> Optional[list]:
    """Returns predefined options for a field that can be mapped."""
    # These match the frontend intakeQuestions.ts options
    options_map = {
        "industry": [
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
        ],
        "tone": [
            {"value": "professional", "label": "Professional", "description": "Formal and business-like"},
            {"value": "friendly", "label": "Friendly", "description": "Warm and approachable"},
            {"value": "casual", "label": "Casual", "description": "Relaxed and conversational"},
            {"value": "authoritative", "label": "Authoritative", "description": "Expert and confident"},
            {"value": "playful", "label": "Playful", "description": "Fun and lighthearted"},
            {"value": "inspirational", "label": "Inspirational", "description": "Motivating and uplifting"},
        ],
        "design_style": [
            {"value": "minimal", "label": "Minimal", "description": "Clean, simple, lots of whitespace"},
            {"value": "modern", "label": "Modern", "description": "Contemporary, bold typography"},
            {"value": "elegant", "label": "Elegant", "description": "Refined, sophisticated, premium feel"},
            {"value": "playful", "label": "Playful", "description": "Fun, colorful, friendly"},
            {"value": "corporate", "label": "Corporate", "description": "Professional, trustworthy, formal"},
            {"value": "bold", "label": "Bold", "description": "Strong contrasts, impactful"},
        ],
        "goal": [
            {"value": "lead_generation", "label": "Generate Leads", "description": "Capture contact info and inquiries"},
            {"value": "sell_products", "label": "Sell Products", "description": "E-commerce and online sales"},
            {"value": "build_brand", "label": "Build Brand", "description": "Establish presence and credibility"},
            {"value": "inform", "label": "Inform Visitors", "description": "Share information and resources"},
            {"value": "portfolio", "label": "Showcase Work", "description": "Display projects and case studies"},
            {"value": "booking", "label": "Take Bookings", "description": "Schedule appointments or reservations"},
        ],
        "font_pair": [
            {"value": "inter_playfair", "label": "Inter + Playfair", "description": "Modern sans + classic serif"},
            {"value": "poppins_lora", "label": "Poppins + Lora", "description": "Geometric + elegant"},
            {"value": "roboto_roboto_slab", "label": "Roboto + Roboto Slab", "description": "Clean + structured"},
            {"value": "montserrat_merriweather", "label": "Montserrat + Merriweather", "description": "Bold + readable"},
            {"value": "open_sans_oswald", "label": "Open Sans + Oswald", "description": "Friendly + impactful"},
            {"value": "system", "label": "System Fonts", "description": "Fast loading, native feel"},
        ],
    }
    return options_map.get(field_name)


def _merge_inferred_values(state: WebsiteState, inferred: Dict[str, Any]) -> None:
    """
    Merge inferred values into state with confidence-based upgrade rules (PR-05).
    Enhanced with field mapping and visual generation.

    Algorithm:
    1) For each field in inferred payload:
       - Compare new_confidence vs old_confidence
       - ACCEPT if: field doesn't exist OR new_conf > old_conf (strictly greater)
    2) If ACCEPT:
       - Store in project_meta["inferred"]
       - Attempt AI mapping to predefined options (if available)
       - Generate visuals for unmatched values
       - Update active field ONLY if NOT in user_overrides
    3) If REJECT:
       - Keep existing inferred value
       - Log that we kept the old value

    User overrides are NEVER modified (user intent is final).
    """
    user_overrides = state.project_meta.get("user_overrides", {})
    existing_inferred = state.project_meta.get("inferred", {})
    field_mappings = state.project_meta.get("field_mappings", {})
    field_visuals = state.project_meta.get("field_visuals", {})

    # Counters for logging
    accepted_count = 0
    upgraded_count = 0
    kept_count = 0
    mapped_count = 0
    visual_generated_count = 0

    # Build context for mapping/visual generation
    context = f"Business: {state.project_name}, Industry: {state.industry}"

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
        # Attempt AI mapping to predefined options (if field has options)
        # ─────────────────────────────────────────────────────────────────────
        if isinstance(new_value, str) and new_value.strip():
            predefined_options = _get_predefined_options_for_field(field_name)
            if predefined_options:
                # Check if value already matches a predefined option
                value_lower = new_value.lower().strip()
                exact_match = None
                for opt in predefined_options:
                    if opt.get("value", "").lower() == value_lower or opt.get("label", "").lower() == value_lower:
                        exact_match = opt["value"]
                        break
                
                if exact_match:
                    # Exact match found, store mapping with high confidence
                    field_mappings[field_name] = {
                        "original_value": new_value,
                        "mapped_value": exact_match,
                        "confidence": 1.0,
                        "rationale": "Exact match to predefined option"
                    }
                    mapped_count += 1
                    print(f"[Enrich] Exact match for '{field_name}': '{new_value}' → '{exact_match}'")
                else:
                    # Attempt AI mapping
                    try:
                        mapping_result = map_to_closest_option(
                            field_name, new_value, predefined_options, context
                        )
                        if mapping_result.get("mapped_value") and mapping_result.get("confidence", 0) >= 0.7:
                            field_mappings[field_name] = mapping_result
                            mapped_count += 1
                            print(f"[Enrich] Mapped '{field_name}': '{new_value}' → '{mapping_result['mapped_value']}' (conf={mapping_result['confidence']:.2f})")
                        else:
                            # No good mapping, generate visuals for unmatched value
                            try:
                                visuals = generate_field_visuals(field_name, new_value, field_name, context)
                                field_visuals[field_name] = visuals
                                visual_generated_count += 1
                                print(f"[Enrich] Generated visuals for unmatched '{field_name}': '{new_value}'")
                            except Exception as e:
                                print(f"[Enrich] Visual generation failed for '{field_name}': {str(e)}")
                    except Exception as e:
                        print(f"[Enrich] Mapping failed for '{field_name}': {str(e)}")
                        # Fallback: generate visuals
                        try:
                            visuals = generate_field_visuals(field_name, new_value, field_name, context)
                            field_visuals[field_name] = visuals
                            visual_generated_count += 1
                        except Exception as ve:
                            print(f"[Enrich] Visual generation also failed: {str(ve)}")
            else:
                # Field has no predefined options, generate visuals directly
                if isinstance(new_value, str) and new_value.strip():
                    try:
                        visuals = generate_field_visuals(field_name, new_value, field_name, context)
                        field_visuals[field_name] = visuals
                        visual_generated_count += 1
                    except Exception as e:
                        print(f"[Enrich] Visual generation failed for '{field_name}': {str(e)}")

        # Store mappings and visuals back to state
        state.project_meta["field_mappings"] = field_mappings
        state.project_meta["field_visuals"] = field_visuals

        # ─────────────────────────────────────────────────────────────────────
        # Update active field ONLY if NOT overridden by user
        # Use mapped value if available, otherwise use original
        # ─────────────────────────────────────────────────────────────────────
        if field_name in user_overrides:
            print(f"[Enrich] Field '{field_name}' is user-overridden, skipping active update")
            continue

        # Determine which value to use: mapped value (if high confidence) or original
        value_to_use = new_value
        if field_name in field_mappings:
            mapping = field_mappings[field_name]
            if mapping.get("mapped_value") and mapping.get("confidence", 0) >= 0.7:
                value_to_use = mapping["mapped_value"]

        # Update active fields based on field name
        if field_name == "industry" and value_to_use:
            state.industry = str(value_to_use)

        elif field_name == "design_style" and value_to_use:
            state.design_style = str(value_to_use)

        elif field_name == "brand_colors" and value_to_use:
            if isinstance(value_to_use, list):
                state.brand_colors = [str(c) for c in value_to_use]
            elif isinstance(value_to_use, str):
                # Handle comma-separated string
                state.brand_colors = [c.strip() for c in value_to_use.split(",")]

        elif field_name == "draft_pages" and value_to_use:
            # Store in additional_context, not as active field
            # Also check if draft_pages is overridden
            if "draft_pages" not in user_overrides:
                if isinstance(value_to_use, list):
                    state.additional_context["draft_pages"] = list(value_to_use)

        elif field_name == "tone" and value_to_use:
            # Store tone in project_meta for later use (not an active field)
            state.project_meta["tone"] = str(value_to_use)

    # Log summary
    state.logs.append(f"Enrich: Merged {accepted_count} new, {upgraded_count} upgraded, {kept_count} kept, {mapped_count} mapped, {visual_generated_count} visuals generated")
