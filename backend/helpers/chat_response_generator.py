# backend/helpers/chat_response_generator.py
"""
Chat Response Generator

Centralizes chat response generation logic and constraints.
Handles phase-specific response strategies and missing info aggregation.
"""

from typing import Dict, Any
from state_schema import WebsiteState


# Phase-specific response guidance (mapped to 3-screen UI)
PHASE_CONSTRAINTS = {
    "intake": "If missing_info is empty, congratulate them and ask if they're ready to proceed. If missing_info has items, ask for ALL missing fields in ONE message: 'I need: X, Y, and Z'. Do NOT ask for fields that are already provided or inferred.",
    "research": "Research is complete. You've analyzed their business. Ready to create the blueprint. Ask if they're ready to proceed.",
    "strategy": "Blueprint foundation ready. Creating page structure...",
    "ux": "User experience mapped. Creating page structure...",
    "planning": "BLUEPRINT GATE: The blueprint is ready with {page_count} pages. Review the blueprint above and approve to start building.",
    "seo": "SEO optimization complete. Working behind the scenes. Building your website...",
    "copywriting": "Marketing content complete. Working behind the scenes. Building your website...",
    "prd": "Technical specifications ready. Working behind the scenes. Building your website...",
    "building": "Building your website. This may take a moment."
}


def get_chat_response_data(state: WebsiteState, user_message: str) -> Dict[str, Any]:
    """
    Prepare data dictionary for chat response prompt.
    Handles complex object serialization and missing info aggregation.
    
    Args:
        state: Current WebsiteState
        user_message: User's message
        
    Returns:
        Dictionary ready for prompt template filling
    """
    import json
    
    response_data = state.model_dump()
    response_data['user_message'] = user_message
    
    # Get constraint for current step
    current_step = state.current_step
    constraint = PHASE_CONSTRAINTS.get(current_step, "Be helpful and concise.")
    
    # Format constraint with dynamic values
    if current_step == "planning" and state.sitemap:
        page_count = len(state.sitemap)
        constraint = constraint.format(page_count=page_count)
    
    response_data['response_strategy'] = constraint
    response_data['prd_length'] = len(state.prd_document)
    response_data['assumptions'] = ", ".join(state.project_meta.get("assumptions", [])) or "None"
    
    # Convert complex objects to safe string representations
    # This prevents .format() from misinterpreting braces within these complex objects
    if response_data.get('sitemap') and len(response_data['sitemap']) > 0:
        response_data['sitemap'] = json.dumps(response_data['sitemap'], indent=2, ensure_ascii=False)
    else:
        response_data['sitemap'] = "No sitemap yet"
    
    # Aggregate missing info - show ALL at once
    if response_data.get('missing_info') and len(response_data['missing_info']) > 0:
        # Filter out inferred fields from missing info
        inferred_fields = state.project_meta.get("inferred_fields", [])
        filtered_missing = [item for item in response_data['missing_info'] if item not in inferred_fields]
        
        if filtered_missing:
            response_data['missing_info'] = ", ".join(str(item) for item in filtered_missing)
        else:
            response_data['missing_info'] = "None"
    else:
        response_data['missing_info'] = "None"
    
    return response_data
