# backend/helpers/field_updater.py
"""
Field Update Utilities

Handles updating WebsiteState fields with proper source tracking.
Tracks whether fields are user-provided, AI-inferred, scraped, or from CRM.
"""

from typing import Literal, Any
from state_schema import WebsiteState

# Field name mapping from router agent updates
FIELD_MAP = {
    "name": "project_name",
    "colors": "brand_colors",
    "style": "design_style"
}


def update_state_field(
    state: WebsiteState,
    field_name: str,
    value: Any,
    source: Literal["user", "inferred", "scraped", "crm"] = "user"
) -> None:
    """
    Update a state field and track its source.
    
    If source is "user" and the field was previously inferred,
    it will be removed from inferred_fields list.
    
    Args:
        state: WebsiteState instance to update
        field_name: Name of the field to update (can be mapped name like "name" or actual field like "project_name")
        value: Value to set
        source: Source of the data ("user", "inferred", "scraped", "crm")
    """
    # Ensure inferred_fields list exists
    if "inferred_fields" not in state.project_meta:
        state.project_meta["inferred_fields"] = []
    
    # Map field name if needed (e.g., "name" -> "project_name")
    target_key = FIELD_MAP.get(field_name.lower(), field_name)
    
    # Check if field exists on state
    if not hasattr(state, target_key):
        print(f"[FIELD_UPDATER] Warning: Field '{target_key}' does not exist on WebsiteState")
        return
    
    # Handle special cases
    if target_key == "brand_colors" and isinstance(value, str):
        value = [value]
    
    # If user provides value, remove from inferred_fields
    if source == "user":
        if target_key in state.project_meta["inferred_fields"]:
            state.project_meta["inferred_fields"].remove(target_key)
            print(f"[FIELD_UPDATER] Removed '{target_key}' from inferred_fields (user provided)")
    
    # If inferred, add to inferred_fields if not already there
    elif source == "inferred":
        if target_key not in state.project_meta["inferred_fields"]:
            state.project_meta["inferred_fields"].append(target_key)
            print(f"[FIELD_UPDATER] Added '{target_key}' to inferred_fields")
    
    # Update the field
    setattr(state, target_key, value)
    print(f"[FIELD_UPDATER] Updated: {target_key} = {value} (source: {source})")


def update_state_from_router_updates(
    state: WebsiteState,
    updates: dict,
    assumptions_list: list
) -> None:
    """
    Update state fields from router agent's updates dict.
    Handles the logic of determining source based on assumptions.
    
    Args:
        state: WebsiteState instance to update
        updates: Dictionary of updates from router agent (e.g., {"name": "value", "colors": ["red"]})
        assumptions_list: List of fields that were assumed/inferred by router
    """
    for key, value in updates.items():
        if value is None:
            continue
        
        # Determine source: if in assumptions, it's inferred; otherwise user-provided
        source = "inferred" if (key in assumptions_list or FIELD_MAP.get(key.lower(), key) in assumptions_list) else "user"
        
        update_state_field(state, key, value, source=source)
