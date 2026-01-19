# backend/agents/registry.py
"""
Skill Registry: Central hub for all agent skills in the multi-agent system.

INTENT-DRIVEN ARCHITECTURE:
- Skills can be invoked directly based on user intent (not just linear flow)
- The Router analyzes user messages to determine the target skill
- Skills maintain a "suggested_next" for linear progression, but it's not enforced
- Each skill has trigger phrases to help the Router identify user intent
"""

from typing import Dict, Callable, Optional, List, Any
from dataclasses import dataclass, field


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
    """Definition of an agent skill - Intent-Driven Architecture"""
    id: str  # Unique identifier (e.g., 'planning', 'prd', 'building')
    name: str  # Human-readable name
    description: str  # What this skill does (used by Router for intent matching)
    agent_function: Callable  # The actual agent function to call

    # Intent-Driven Fields
    trigger_phrases: List[str] = field(default_factory=list)  # Phrases that trigger this skill
    can_invoke_directly: bool = True  # Can this skill be called out-of-order?

    # Flow Control (suggested, not enforced)
    suggested_next: Optional[str] = None  # Recommended next step (for PROCEED flow)
    phase_order: int = 0  # Numeric order in the standard flow (for UI display)

    # Behavior Flags
    requires_approval: bool = True  # Does this need user PROCEED action?
    revision_supported: bool = True  # Can this skill be revised with feedback?
    auto_execute: bool = False  # Should this run automatically after previous skill?

    # Display
    icon: str = "⚙️"  # Display icon

    # Prerequisites (skills that should ideally run first)
    prerequisites: List[str] = field(default_factory=list)

    def execute(self, state, feedback=None):
        """Execute the skill's agent function"""
        if feedback:
            return self.agent_function(state, feedback=feedback)
        return self.agent_function(state)

    def get_handoff_suggestion(self) -> Optional[str]:
        """Get the suggested next skill after this one completes"""
        return self.suggested_next

    def matches_intent(self, user_message: str) -> bool:
        """Check if user message matches this skill's trigger phrases"""
        message_lower = user_message.lower()
        return any(phrase.lower() in message_lower for phrase in self.trigger_phrases)


# ============================================================================
# SKILL REGISTRY: The Central Toolbox (Intent-Driven)
# ============================================================================

class SkillRegistry:
    """
    Central registry of all available skills.

    Intent-Driven Architecture:
    - Skills can be invoked directly via user intent
    - Linear flow (PROCEED) still works via suggested_next
    - Each skill has trigger phrases for intent detection
    """

    def __init__(self):
        self._skills: Dict[str, Skill] = {}
        self._phase_order: List[str] = []  # Ordered list for linear flow
        self._register_core_skills()

    def _register_core_skills(self):
        """Register all core agent skills with intent-driven configuration"""
        from agents.planner_agent import run_planner_agent
        from agents.prd_agent import run_prd_agent
        from agents.strategy_agent import run_strategy_agent
        from agents.ux_agent import run_ux_agent
        from agents.seo_agent import run_seo_agent
        from agents.copy_agent import run_copy_agent
        from agents.research_agent import run_research_agent

        # Define the standard phase order for linear progression
        # Note: "research" runs automatically during intake, not as a separate phase
        self._phase_order = ["intake", "research", "strategy", "ux", "planning", "seo", "copywriting", "prd", "building"]

        # INTAKE SKILL (Special: runs automatically via router, collects info)
        self.register(Skill(
            id="intake",
            name="Intake & Audit",
            description="Collects and validates project information like business name, industry, colors, and style. Ensures all required data is gathered before proceeding.",
            agent_function=lambda state: state,  # Runs inline in router
            trigger_phrases=["start over", "new project", "change the name", "update industry"],
            can_invoke_directly=False,  # Always runs as part of router
            suggested_next="research",  # Now goes to research first
            phase_order=0,
            requires_approval=True,
            revision_supported=False,
            auto_execute=False,
            icon="📋",
            prerequisites=[]
        ))

        # RESEARCH SKILL: Magic Background Discovery
        self.register(Skill(
            id="research",
            name="Business Researcher",
            description="Automatically researches the business by scraping their website (if URL provided) or using AI to infer industry insights, brand personality, target audience, and market trends.",
            agent_function=run_research_agent,
            trigger_phrases=["research", "analyze", "discover", "learn about", "scrape", "website url"],
            can_invoke_directly=True,
            suggested_next="strategy",
            phase_order=1,
            requires_approval=False,  # Auto-runs silently
            revision_supported=True,
            auto_execute=True,  # Runs automatically after intake PROCEED
            icon="🔬",
            prerequisites=["intake"]
        ))

        # STRATEGY SKILL: Project Brief Synthesis
        self.register(Skill(
            id="strategy",
            name="Project Brief",
            description="Synthesizes all research into a comprehensive Project Brief document. Creates executive summary, target audience analysis, value proposition, brand voice, and visual direction.",
            agent_function=run_strategy_agent,
            trigger_phrases=["brief", "strategy", "business goals", "target audience", "value proposition", "brand voice", "update the brief"],
            can_invoke_directly=True,
            suggested_next="ux",
            phase_order=2,
            requires_approval=True,  # GATE: User must approve the Project Brief
            revision_supported=True,
            auto_execute=True,  # Auto-runs after research
            icon="📋",
            prerequisites=["research"]
        ))

        # UX SKILL: User Personas & Conversion Maps
        self.register(Skill(
            id="ux",
            name="UX Designer",
            description="Creates user personas, maps pain points, designs user journeys, and identifies conversion paths. Uses the Project Brief to ensure user-centered design.",
            agent_function=run_ux_agent,
            trigger_phrases=["user persona", "user experience", "ux", "conversion", "user journey", "pain points"],
            can_invoke_directly=True,
            suggested_next="planning",
            phase_order=3,
            requires_approval=False,
            revision_supported=True,
            auto_execute=True,  # Auto-runs after strategy approval
            icon="🎨",
            prerequisites=["strategy"]  # Requires Project Brief to be approved
        ))

        # PLANNING SKILL: Sitemap Generation
        self.register(Skill(
            id="planning",
            name="Sitemap Architect",
            description="Designs the website structure including pages, their purposes, and section layouts. Creates a high-fidelity sitemap that guides the entire build.",
            agent_function=run_planner_agent,
            trigger_phrases=["sitemap", "pages", "structure", "add a page", "remove page", "website structure", "navigation", "update the sitemap"],
            can_invoke_directly=True,
            suggested_next="seo",
            phase_order=4,
            requires_approval=True,  # GATE 1: Stop for user approval
            revision_supported=True,
            auto_execute=True,  # Auto-runs after UX
            icon="🏗️",
            prerequisites=["ux"]
        ))

        # SEO SKILL: Search Engine Optimization
        self.register(Skill(
            id="seo",
            name="SEO Specialist",
            description="Generates keyword strategy, meta titles, meta descriptions, and search intent analysis. Optimizes each page for search engine visibility.",
            agent_function=run_seo_agent,
            trigger_phrases=["seo", "keywords", "meta title", "meta description", "search", "google", "ranking"],
            can_invoke_directly=True,
            suggested_next="copywriting",
            phase_order=5,
            requires_approval=False,
            revision_supported=True,
            auto_execute=True,  # Auto-runs after planning approval
            icon="🔍",
            prerequisites=["planning"]
        ))

        # COPYWRITING SKILL: Marketing Copy
        self.register(Skill(
            id="copywriting",
            name="Copywriter",
            description="Writes compelling headlines, subheaders, CTAs, and body copy for each page section. Creates persuasive content aligned with brand voice.",
            agent_function=run_copy_agent,
            trigger_phrases=["copy", "headline", "cta", "text", "content", "writing", "messaging", "update the copy"],
            can_invoke_directly=True,
            suggested_next="prd",
            phase_order=6,
            requires_approval=True,  # GATE 2: Stop for user approval
            revision_supported=True,
            auto_execute=True,  # Auto-runs after SEO
            icon="✍️",
            prerequisites=["seo"]
        ))

        # PRD SKILL: Technical Requirements
        self.register(Skill(
            id="prd",
            name="Technical Strategist",
            description="Creates a comprehensive Product Requirements Document including technical specifications, component requirements, and implementation details.",
            agent_function=run_prd_agent,
            trigger_phrases=["prd", "technical", "requirements", "specifications", "implementation"],
            can_invoke_directly=True,
            suggested_next="building",
            phase_order=7,
            requires_approval=False,
            revision_supported=True,
            auto_execute=True,  # Auto-runs after copywriting approval
            icon="📄",
            prerequisites=["copywriting"]
        ))

        # BUILDING SKILL: Code Generation
        self.register(Skill(
            id="building",
            name="Code Builder",
            description="Generates production-ready HTML/CSS code with Tailwind styling. Builds the complete website based on all previous specifications.",
            agent_function=self._placeholder_builder,
            trigger_phrases=["build", "code", "generate", "create website", "html", "start building"],
            can_invoke_directly=True,
            suggested_next=None,  # Final step
            phase_order=8,
            requires_approval=False,
            revision_supported=True,
            auto_execute=True,  # Auto-runs after PRD
            icon="🚀",
            prerequisites=["prd"]
        ))

    def register(self, skill: Skill):
        """Add a skill to the registry"""
        self._skills[skill.id] = skill

    def get(self, skill_id: str) -> Optional[Skill]:
        """Retrieve a skill by ID"""
        return self._skills.get(skill_id)

    def get_by_step(self, step: str) -> Optional[Skill]:
        """Get the skill associated with a given step/phase"""
        return self._skills.get(step)

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
    # INTENT-DRIVEN METHODS
    # ========================================================================

    def get_skill_descriptions_for_prompt(self) -> str:
        """
        Generate a formatted string of all skills for the Router prompt.
        Includes ID, name, description, and trigger phrases.
        """
        lines = []
        for skill_id in self._phase_order:
            skill = self._skills.get(skill_id)
            if skill:
                triggers = ", ".join(skill.trigger_phrases[:5])  # First 5 triggers
                can_direct = "Yes" if skill.can_invoke_directly else "No"
                lines.append(
                    f"- {skill.icon} **{skill.id}** ({skill.name}): {skill.description}\n"
                    f"  Triggers: [{triggers}] | Direct invoke: {can_direct}"
                )
        return "\n".join(lines)

    def find_skill_by_intent(self, user_message: str) -> Optional[Skill]:
        """
        Find a skill that matches the user's intent based on trigger phrases.
        Returns the first matching skill or None.
        """
        for skill in self._skills.values():
            if skill.can_invoke_directly and skill.matches_intent(user_message):
                return skill
        return None

    def get_next_in_flow(self, current_step: str) -> Optional[str]:
        """
        Get the next step in the standard linear flow.
        Used when user says "proceed" or "looks good".
        """
        try:
            current_idx = self._phase_order.index(current_step)
            if current_idx < len(self._phase_order) - 1:
                return self._phase_order[current_idx + 1]
        except ValueError:
            pass
        return None

    def get_natural_next_step(self, current_step: str) -> Optional[str]:
        """
        Get the suggested next step based on the current skill's configuration.
        Falls back to linear flow if no suggestion.
        """
        current_skill = self.get(current_step)
        if current_skill and current_skill.suggested_next:
            return current_skill.suggested_next
        return self.get_next_in_flow(current_step)

    def get_phase_order(self) -> List[str]:
        """Get the ordered list of phases for linear progression"""
        return self._phase_order.copy()

    def check_prerequisites(self, skill_id: str, state) -> List[str]:
        """
        Check if a skill's prerequisites are met.
        Returns a list of missing prerequisite skill IDs.
        """
        skill = self.get(skill_id)
        if not skill:
            return []

        missing = []
        for prereq_id in skill.prerequisites:
            # Check if prerequisite has produced output
            if prereq_id == "intake" and state.missing_info:
                missing.append(prereq_id)
            elif prereq_id == "research" and not state.additional_context.get("research_data"):
                missing.append(prereq_id)
            elif prereq_id == "strategy" and not state.project_brief:
                missing.append(prereq_id)
            elif prereq_id == "ux" and not state.ux_strategy:
                missing.append(prereq_id)
            elif prereq_id == "planning" and not state.sitemap:
                missing.append(prereq_id)
            elif prereq_id == "seo" and not state.seo_data:
                missing.append(prereq_id)
            elif prereq_id == "copywriting" and not state.copywriting:
                missing.append(prereq_id)
            elif prereq_id == "prd" and not state.prd_document:
                missing.append(prereq_id)
        return missing

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
