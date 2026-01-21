"""
Constants for the Clarity application.

Centralizes all magic strings and markers used throughout the backend.
"""

from enum import Enum
import re

# ============================================================================
# STEP NAMES
# ============================================================================

class StepName(str, Enum):
    """Valid workflow step names."""
    INTAKE = "intake"
    RESEARCH = "research"
    STRATEGY = "strategy"
    UX = "ux"
    PLANNING = "planning"
    SEO = "seo"
    COPYWRITING = "copywriting"
    PRD = "prd"
    BUILDING = "building"

# List of all step names for iteration
ALL_STEPS = [step.value for step in StepName]

# ============================================================================
# STATE UPDATE MARKERS
# ============================================================================

# Marker used to delimit state updates in streaming responses
STATE_UPDATE_MARKER = "|||STATE_UPDATE|||"

# ============================================================================
# GATE ACTION MARKERS
# ============================================================================

# Pattern for gate action markers: [GATE_ACTION: GATE_NAME]
GATE_ACTION_PATTERN = re.compile(r"\[GATE_ACTION:\s*([^\]]+)\]")

# Gate names (mapped from step names for UI consistency)
GATE_INTAKE = "INTAKE_&_AUDIT"
GATE_BLUEPRINT = "BLUEPRINT"  # Maps from "planning" step
GATE_MARKETING = "MARKETING"  # Maps from "copywriting" step

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_gate_name_for_step(step_id: str, skill_name: str = "") -> str:
    """
    Get the gate name for a given step ID.
    
    Args:
        step_id: The step ID (e.g., "planning", "intake")
        skill_name: Optional skill name for fallback
        
    Returns:
        Gate name string (e.g., "BLUEPRINT", "INTAKE_&_AUDIT")
    """
    if step_id == StepName.PLANNING.value:
        return GATE_BLUEPRINT
    elif step_id == StepName.INTAKE.value:
        return GATE_INTAKE
    elif step_id == StepName.COPYWRITING.value:
        return GATE_MARKETING
    else:
        # Fallback: convert skill name to uppercase with underscores
        return skill_name.upper().replace(" ", "_") if skill_name else "UNKNOWN"
