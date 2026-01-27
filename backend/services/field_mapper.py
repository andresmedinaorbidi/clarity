# backend/services/field_mapper.py
"""
Field Mapper Service - Maps inferred values to closest matching predefined options.

Uses AI to intelligently map field values (industry, tone, style, goal, font_pair)
to predefined options when possible, with confidence scoring.
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from utils import ask_gemini


def map_to_closest_option(
    field_name: str,
    value: str,
    predefined_options: List[Dict[str, Any]],
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Maps a field value to the closest matching predefined option using AI.
    
    Args:
        field_name: Name of the field (e.g., "industry", "tone", "style")
        value: The value to map (e.g., "Tech Startup", "Casual & Friendly")
        predefined_options: List of predefined options with 'value' and 'label' keys
        context: Optional context about the business/project
    
    Returns:
        Dict with:
            - mapped_value: The closest matching option value (or None if no good match)
            - confidence: Confidence score 0.0-1.0
            - rationale: Explanation of the mapping
            - original_value: The original value
    """
    if not value or not predefined_options:
        return {
            "mapped_value": None,
            "confidence": 0.0,
            "rationale": "No value or options provided",
            "original_value": value
        }
    
    # Build options list for prompt
    options_list = []
    for opt in predefined_options:
        opt_value = opt.get("value", "")
        opt_label = opt.get("label", opt_value)
        opt_desc = opt.get("description", "")
        options_list.append(f"- {opt_value} ({opt_label}){': ' + opt_desc if opt_desc else ''}")
    
    options_text = "\n".join(options_list)
    
    # Build prompt
    context_text = f"\n\nAdditional context: {context}" if context else ""
    
    prompt = f"""You are a Field Mapping Agent. Your task is to map a user-provided or inferred value to the closest matching predefined option.

FIELD: {field_name}
VALUE TO MAP: "{value}"
{context_text}

AVAILABLE OPTIONS:
{options_text}

YOUR TASK:
1. Determine if "{value}" matches or closely relates to any of the predefined options
2. If there's a good match (confidence > 0.7), return the matching option's value
3. If no good match exists, return null for mapped_value with low confidence

CONFIDENCE SCALE:
- 0.9-1.0: Exact or near-exact match (e.g., "Technology" → "technology")
- 0.7-0.9: Strong semantic match (e.g., "Tech Startup" → "technology")
- 0.5-0.7: Weak match, but related (e.g., "Software Development" → "technology")
- 0.0-0.5: No good match, should return null

Return ONLY a valid JSON object with this exact structure:
{{
  "mapped_value": "option_value_or_null",
  "confidence": 0.0-1.0,
  "rationale": "brief explanation"
}}

IMPORTANT:
- Return null for mapped_value if confidence < 0.7
- Be strict - only map if there's a clear semantic relationship
- Return ONLY the JSON object, no markdown, no explanation"""
    
    try:
        response = ask_gemini(prompt, json_mode=True)
        result = json.loads(response)
        
        # Validate and normalize result
        mapped_value = result.get("mapped_value")
        confidence = float(result.get("confidence", 0.0))
        rationale = result.get("rationale", "")
        
        # Ensure confidence is in valid range
        confidence = max(0.0, min(1.0, confidence))
        
        # If confidence is low, set mapped_value to None
        if confidence < 0.7:
            mapped_value = None
        
        return {
            "mapped_value": mapped_value,
            "confidence": confidence,
            "rationale": rationale,
            "original_value": value
        }
    except Exception as e:
        print(f"[FieldMapper] Error mapping {field_name}='{value}': {str(e)}")
        return {
            "mapped_value": None,
            "confidence": 0.0,
            "rationale": f"Mapping failed: {str(e)[:50]}",
            "original_value": value
        }


def get_predefined_options_for_field(field_name: str) -> Optional[List[Dict[str, Any]]]:
    """
    Returns predefined options for a given field name.
    This is a helper that can be extended to fetch from a central config.
    
    For now, returns None - options should be passed directly to map_to_closest_option.
    """
    # This can be extended to fetch from a central configuration
    return None
