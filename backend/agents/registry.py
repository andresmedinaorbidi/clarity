# backend/agents/registry.py
"""
Skill Registry: Central hub for all agent skills in the multi-agent system.

Each skill represents a capability that can be invoked by the Router.
Skills can suggest handoffs to other skills, creating a dynamic chain of command.
"""

from typing import Dict, Callable, Optional, List, Any
from dataclasses import dataclass


@dataclass
class SkillResult:
    """Return value from a skill execution"""
    success: bool
    message: str = ""
    handoff_suggestion: Optional[str] = None  # Next skill to invoke
    data: Dict[str, Any] = None  # Additional data returned by skill

    def __post_init__(self):
        if self.data is None:
            self.data = {}


@dataclass
class Skill:
    """Definition of an agent skill"""
    id: str  # Unique identifier (e.g., 'planning', 'prd', 'building')
    name: str  # Human-readable name
    description: str  # What this skill does
    agent_function: Callable  # The actual agent function to call
    required_step: str  # Which state.current_step triggers this skill
    next_step: Optional[str] = None  # What step to transition to after execution
    requires_approval: bool = True  # Does this need user PROCEED action?
    icon: str = "⚙️"  # Display icon
    revision_supported: bool = True  # Can this skill be revised?

    def execute(self, state, feedback=None):
        """Execute the skill's agent function"""
        if feedback:
            return self.agent_function(state, feedback=feedback)
        return self.agent_function(state)

    def get_handoff_suggestion(self) -> Optional[str]:
        """Get the suggested next skill after this one completes"""
        return self.next_step


# ============================================================================
# SKILL REGISTRY: The Central Toolbox
# ============================================================================

class SkillRegistry:
    """Central registry of all available skills"""

    def __init__(self):
        self._skills: Dict[str, Skill] = {}
        self._register_core_skills()

    def _register_core_skills(self):
        """Register all core agent skills"""
        from agents.planner_agent import run_planner_agent
        from agents.prd_agent import run_prd_agent
        from agents.strategy_agent import run_strategy_agent
        from agents.ux_agent import run_ux_agent
        from agents.seo_agent import run_seo_agent
        from agents.copy_agent import run_copy_agent
        from agents.direction_lock_agent import run_direction_lock_agent
        from agents.structure_confirm_agent import run_structure_confirm_agent
        from agents.reveal_agent import run_reveal_agent

        # INTAKE SKILL (Non-blocking unless critical fields missing)
        self.register(Skill(
            id="intake",
            name="Intake & Audit",
            description="Validates critical project information (audience, offer, location, goal)",
            agent_function=lambda state: state,  # Runs inline in router
            required_step="intake",
            next_step="strategy",
            requires_approval=False,  # MAGICAL FLOW: Auto-proceed unless critical missing
            icon="📋",
            revision_supported=False
        ))

        # STRATEGY SKILL: Business Goals & Target Audience
        self.register(Skill(
            id="strategy",
            name="Business Strategist",
            description="Defines business goals, target audience, and success metrics",
            agent_function=run_strategy_agent,
            required_step="strategy",
            next_step="direction_lock",  # MAGICAL FLOW: Strategy → Direction Lock
            requires_approval=False,  # Runs automatically after intake
            icon="🎯",
            revision_supported=True
        ))

        # DIRECTION LOCK SKILL: Freeze strategic direction (GATE A)
        self.register(Skill(
            id="direction_lock",
            name="Direction Lock",
            description="Creates and freezes a concise strategic direction snapshot",
            agent_function=run_direction_lock_agent,
            required_step="direction_lock",
            next_step="ux",
            requires_approval=True,  # GATE A: User must approve direction
            icon="🎯",
            revision_supported=True
        ))

        # UX SKILL: User Personas & Conversion Maps
        self.register(Skill(
            id="ux",
            name="UX Designer",
            description="Maps user personas, pain points, and conversion paths",
            agent_function=run_ux_agent,
            required_step="ux",
            next_step="structure_confirm",  # MAGICAL FLOW: UX → Structure Confirm
            requires_approval=False,  # Runs automatically after direction_lock
            icon="🎨",
            revision_supported=True
        ))

        # STRUCTURE CONFIRM SKILL: Sitemap approval (GATE B)
        self.register(Skill(
            id="structure_confirm",
            name="Structure Confirm",
            description="Generates and confirms site structure/sitemap",
            agent_function=run_structure_confirm_agent,
            required_step="structure_confirm",
            next_step="seo",  # After structure approved → marketing pipeline
            requires_approval=True,  # GATE B: User must approve sitemap
            icon="🏗️",
            revision_supported=True
        ))

        # PRD SKILL: Technical Strategy
        self.register(Skill(
            id="prd",
            name="Technical Strategist",
            description="Creates comprehensive technical PRD and implementation plan",
            agent_function=run_prd_agent,
            required_step="prd",
            next_step="building",
            requires_approval=False,  # TWO-GATE: Auto-execute after GATE 2
            icon="📄",
            revision_supported=True
        ))

        # BUILDING SKILL: Code Generation
        self.register(Skill(
            id="building",
            name="Code Builder",
            description="Generates production-ready HTML/CSS code",
            agent_function=self._placeholder_builder,
            required_step="building",
            next_step="reveal",  # MAGICAL FLOW: Building → Reveal
            requires_approval=False,  # Auto-execute after PRD
            icon="🚀",
            revision_supported=True
        ))

        # REVEAL SKILL: Interactive preview and feedback
        self.register(Skill(
            id="reveal",
            name="Reveal & Refine",
            description="Presents interactive preview and collects feedback",
            agent_function=run_reveal_agent,
            required_step="reveal",
            next_step=None,  # Terminal state (feedback loop)
            requires_approval=False,  # Non-blocking - feedback is optional
            icon="🎉",
            revision_supported=True
        ))

        # MARKETING SKILLS: SEO & Copywriting
        self.register(Skill(
            id="seo",
            name="SEO Specialist",
            description="Generates SEO strategy, keywords, meta titles, and meta descriptions",
            agent_function=run_seo_agent,
            required_step="seo",
            next_step="copywriting",
            requires_approval=False,  # Auto-executes after planning
            icon="🔍",
            revision_supported=True
        ))

        self.register(Skill(
            id="copywriting",
            name="Copywriter",
            description="Generates section-specific headlines, subheaders, and CTAs",
            agent_function=run_copy_agent,
            required_step="copywriting",
            next_step="prd",  # Copywriting → PRD (no approval)
            requires_approval=False,  # MAGICAL FLOW: Copy is draft, no blocking approval
            icon="✍️",
            revision_supported=True
        ))

    def register(self, skill: Skill):
        """Add a skill to the registry"""
        self._skills[skill.id] = skill

    def get(self, skill_id: str) -> Optional[Skill]:
        """Retrieve a skill by ID"""
        return self._skills.get(skill_id)

    def get_by_step(self, step: str) -> Optional[Skill]:
        """Get the primary skill for a given step"""
        for skill in self._skills.values():
            if skill.required_step == step:
                return skill
        return None

    def list_all(self) -> List[Skill]:
        """Get all registered skills"""
        return list(self._skills.values())

    def get_available_skills(self) -> Dict[str, str]:
        """Get a dict of available skills for prompt injection"""
        return {
            skill.id: f"{skill.icon} {skill.name}: {skill.description}"
            for skill in self._skills.values()
        }

    # ========================================================================
    # PLACEHOLDER AGENTS (To be implemented)
    # ========================================================================

    def _placeholder_builder(self, state, feedback=None):
        """Placeholder for builder agent (will be imported later)"""
        from agents.builder_agent import run_builder_agent
        if feedback:
            return run_builder_agent(state, feedback=feedback)
        return run_builder_agent(state)

    def _placeholder_seo(self, state, feedback=None):
        """Placeholder for future SEO agent"""
        yield "🔍 **SEO Optimization** (Coming Soon)\n\n"
        state.seo_data = {"status": "placeholder"}

    def _placeholder_ux(self, state, feedback=None):
        """Placeholder for future UX strategy agent"""
        yield "🎯 **UX Strategy** (Coming Soon)\n\n"
        state.ux_strategy = {"status": "placeholder"}

    def _placeholder_copy(self, state, feedback=None):
        """Placeholder for future copywriting agent"""
        yield "✍️ **Copywriting** (Coming Soon)\n\n"
        state.copywriting = {"status": "placeholder"}


# ============================================================================
# GLOBAL REGISTRY INSTANCE
# ============================================================================

# Singleton registry instance
_registry = None

def get_registry() -> SkillRegistry:
    """Get the global skill registry (singleton pattern)"""
    global _registry
    if _registry is None:
        _registry = SkillRegistry()
    return _registry
