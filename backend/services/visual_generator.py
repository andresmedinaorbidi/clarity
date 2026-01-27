# backend/services/visual_generator.py
"""
Visual Generator Service - Generates card visuals for unmatched field values.

Uses AI to generate appropriate icon names, colors, and characteristics
for field values that don't match predefined options.
"""

import json
from typing import Dict, Any, Optional
from utils import ask_gemini


# Common lucide-react icon names that can be used
COMMON_ICONS = [
    "Briefcase", "Code", "ShoppingCart", "Heart", "DollarSign", "GraduationCap",
    "Utensils", "Home", "Scale", "Palette", "HeartHandshake", "Building2",
    "Target", "MessageCircle", "Smile", "Coffee", "Award", "Sparkles", "Zap",
    "TrendingUp", "Users", "Globe", "Rocket", "Star", "Lightbulb", "Puzzle",
    "Shield", "Gift", "Camera", "Music", "Book", "Gamepad2", "Car", "Plane"
]


def generate_field_visuals(
    field_name: str,
    value: str,
    field_type: str = "general",
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates visual metadata (icon, color, characteristics) for an unmatched field value.
    
    Args:
        field_name: Name of the field (e.g., "industry", "tone")
        value: The value to generate visuals for
        field_type: Type hint ("industry", "tone", "style", "goal", etc.)
        context: Optional context about the business/project
    
    Returns:
        Dict with:
            - icon: Icon name from lucide-react (e.g., "Code", "Briefcase")
            - color: Hex color code (e.g., "#3B82F6")
            - characteristics: List of 3-4 descriptive words/phrases
    """
    if not value:
        return _get_generic_fallback_visuals(field_type)
    
    # Build prompt
    context_text = f"\n\nAdditional context: {context}" if context else ""
    
    prompt = f"""You are a Visual Design Agent. Generate appropriate visual metadata for a field value that doesn't match predefined options.

FIELD: {field_name} ({field_type})
VALUE: "{value}"
{context_text}

YOUR TASK:
Generate visual metadata that represents this value in a card UI:
1. Icon: Choose an appropriate icon name from lucide-react (common names: {', '.join(COMMON_ICONS[:10])})
2. Color: Choose a hex color code that represents the value's personality/theme
3. Characteristics: Generate 3-4 short descriptive words/phrases (2-3 words each)

EXAMPLES:
- Industry "Tech Startup" → icon: "Code", color: "#3B82F6", characteristics: ["Innovation", "Digital", "Cutting-edge"]
- Tone "Casual & Friendly" → icon: "Smile", color: "#22C55E", characteristics: ["Warm", "Approachable", "Welcoming"]
- Style "Bold & Modern" → icon: "Zap", color: "#EF4444", characteristics: ["Strong", "Impactful", "Contemporary"]

Return ONLY a valid JSON object with this exact structure:
{{
  "icon": "IconName",
  "color": "#HEXCODE",
  "characteristics": ["Word1", "Word2", "Word3"]
}}

IMPORTANT:
- Icon must be a valid lucide-react icon name (use common names like Briefcase, Code, Heart, etc.)
- Color should be a valid hex code (#RRGGBB format)
- Characteristics should be 3-4 items, each 2-3 words max
- Return ONLY the JSON object, no markdown, no explanation"""
    
    try:
        response = ask_gemini(prompt, json_mode=True)
        result = json.loads(response)
        
        # Validate and normalize
        icon = result.get("icon", "Briefcase")
        color = result.get("color", "#6B7280")
        characteristics = result.get("characteristics", [])
        
        # Ensure icon is valid (fallback to common icon if not in list)
        if icon not in COMMON_ICONS:
            # Try to find a similar icon or use generic
            icon = _find_similar_icon(icon) or "Briefcase"
        
        # Validate color format
        if not color.startswith("#") or len(color) != 7:
            color = "#6B7280"  # Default gray
        
        # Ensure characteristics is a list with 3-4 items
        if not isinstance(characteristics, list):
            characteristics = []
        if len(characteristics) < 3:
            characteristics.extend(["Custom", "Unique", "Specialized"][:3 - len(characteristics)])
        if len(characteristics) > 4:
            characteristics = characteristics[:4]
        
        return {
            "icon": icon,
            "color": color,
            "characteristics": characteristics
        }
    except Exception as e:
        print(f"[VisualGenerator] Error generating visuals for {field_name}='{value}': {str(e)}")
        return _get_generic_fallback_visuals(field_type)


def _find_similar_icon(icon_name: str) -> Optional[str]:
    """Finds a similar icon from COMMON_ICONS if the provided name doesn't match exactly."""
    icon_lower = icon_name.lower()
    for common_icon in COMMON_ICONS:
        if common_icon.lower() == icon_lower or common_icon.lower().startswith(icon_lower[:3]):
            return common_icon
    return None


def _get_generic_fallback_visuals(field_type: str) -> Dict[str, Any]:
    """Returns generic fallback visuals when generation fails."""
    fallbacks = {
        "industry": {"icon": "Briefcase", "color": "#6B7280", "characteristics": ["Business", "Professional", "Custom"]},
        "tone": {"icon": "MessageCircle", "color": "#6B7280", "characteristics": ["Custom", "Unique", "Distinctive"]},
        "style": {"icon": "Palette", "color": "#6B7280", "characteristics": ["Custom", "Unique", "Specialized"]},
        "goal": {"icon": "Target", "color": "#6B7280", "characteristics": ["Custom", "Specific", "Tailored"]},
    }
    return fallbacks.get(field_type, {"icon": "Briefcase", "color": "#6B7280", "characteristics": ["Custom", "Unique", "Specialized"]})
