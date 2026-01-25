from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class InferredField(BaseModel):
    """Represents a field value inferred by an agent with metadata."""
    value: Any
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    source: str = ""  # e.g., "research_agent", "strategy_agent", "user_input"
    rationale: str = ""  # Explanation of why this value was inferred


class ProjectMeta(BaseModel):
    """
    Project metadata with support for inferred values and user overrides.

    - inferred: Agent-inferred values with confidence and rationale
    - user_overrides: User-provided values that take precedence over inferred
    """
    inferred: Dict[str, InferredField] = {}
    user_overrides: Dict[str, Any] = {}


class AgentReasoning(BaseModel):
    agent_name: str
    thought: str
    certainty: float

class WebsiteState(BaseModel):
    # 1. User Inputs (The raw data)
    project_name: str = ""
    industry: str = ""

    brand_colors: List[str] = []  # e.g., ["Black", "Neon Green"]
    design_style: str = ""       # e.g., "Minimalist", "Cyberpunk"


    # This allows you to add any "extra fields" later without breaking the app
    additional_context: Dict[str, Any] = {}

    # 2. External Data (The "Mock" RAG/MCP results)
    crm_data: Dict[str, Any] = {}

    # 3. Agent Progress
    missing_info: List[str] = []  # List of things the Intake agent still needs
    project_brief: str = ""       # Strategy synthesis - Markdown document for user approval
    sitemap: List[Dict[str, Any]] = []  # High-fidelity: [{title, purpose, sections}]
    prd_document: str = ""        # Populated by the PRD agent
    generated_code: str = ""      # The final HTML/Tailwind result

    # 4. Status Tracking
    current_step: str = "intake"  # intake, planning, building, etc.
    logs: List[str] = []          # History of what has happened

    chat_history: List[Dict[str, str]] = []

    # 5. Extended Architecture Support
    project_meta: ProjectMeta = Field(default_factory=ProjectMeta)  # Inferred values + user overrides
    agent_reasoning: List[AgentReasoning] = []  # Agent thoughts and certainty levels
    seo_data: Optional[Dict[str, Any]] = None  # Keywords, meta titles, descriptions
    ux_strategy: Optional[Dict[str, Any]] = None  # User personas, conversion maps
    copywriting: Optional[Dict[str, Any]] = None  # Headlines, body text
    context_summary: str = ""  # Compressed project history
