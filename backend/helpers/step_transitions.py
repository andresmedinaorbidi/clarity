"""
Step transition utilities.

Pure functions for determining workflow step transitions and validation.
"""

from typing import Optional
from state_schema import WebsiteState
from agents.registry import SkillRegistry
from constants import StepName


def get_next_step(
    current_step: str,
    action: str,
    registry: Optional[SkillRegistry] = None,
    natural_next_step: Optional[str] = None
) -> Optional[str]:
    """
    Determine the next step in the workflow based on current step and action.
    
    Args:
        current_step: Current workflow step
        action: User action (PROCEED, REVISE, etc.)
        registry: Optional SkillRegistry instance
        natural_next_step: Optional next step from AI decision
        
    Returns:
        Next step ID or None if no transition available
    """
    if action != "PROCEED":
        # Only handle PROCEED action for step transitions
        return natural_next_step
    
    # Special handling for specific phase transitions
    if current_step == StepName.INTAKE.value:
        # After intake approval, go to research
        return StepName.RESEARCH.value
    elif current_step == StepName.RESEARCH.value:
        # After research approval, execute blueprint chain: strategy → ux → planning
        return StepName.STRATEGY.value
    elif current_step == StepName.PLANNING.value:
        # After blueprint approval, execute build chain: seo → copywriting → prd → building
        return StepName.SEO.value
    else:
        # Use natural_next_step if provided, otherwise query registry
        if natural_next_step:
            return natural_next_step
        
        if registry:
            return registry.get_natural_next_step(current_step)
        
        return None


def can_proceed_from_step(step: str, state: WebsiteState) -> bool:
    """
    Check if the workflow can proceed from the current step.
    
    Args:
        step: Current workflow step
        state: Current WebsiteState
        
    Returns:
        True if can proceed, False otherwise
    """
    if step == StepName.INTAKE.value:
        # Cannot proceed from intake if missing required information
        return not bool(state.missing_info)
    
    # All other steps can proceed (gates are handled by skill registry)
    return True
