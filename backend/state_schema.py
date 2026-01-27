from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class AgentReasoning(BaseModel):
    agent_name: str
    thought: str
    certainty: float


class InferredField(BaseModel):
    """
    Represents a machine-inferred field value with metadata.
    PR-02: Schema support for inferred fields.

    Attributes:
        value: The inferred value (can be string, list, dict, etc.)
        confidence: Confidence score 0.0-1.0 (0=low, 1=high)
        source: Origin of inference ("llm", "scraped", "hybrid", "default")
        rationale: Short explanation of why this value was inferred
    """
    value: Any = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source: str = ""  # e.g., "llm", "scraped", "hybrid", "default"
    rationale: str = ""  # e.g., "Extracted from website hero section"


def _default_project_meta() -> Dict[str, Any]:
    """
    Default factory for project_meta to ensure inferred/user_overrides keys exist.
    PR-02: Ensures structure for enrichment workflow.
    """
    return {
        "inferred": {},        # Dict[str, InferredField-like dict]
        "user_overrides": {},  # Dict[str, Any] - explicit user values
        "field_mappings": {},  # Dict[str, Dict] - Maps field_name → {original_value, mapped_value, confidence, rationale}
        "field_visuals": {},   # Dict[str, Dict] - Maps field_name → {icon, color, characteristics} for unmatched values
    }


class WebsiteState(BaseModel):
    # 1. User Inputs (The raw data)
    project_name: str = ""
    industry: str = ""

    brand_colors: List[str] = Field(default_factory=list)  # e.g., ["Black", "Neon Green"]
    design_style: str = ""  # e.g., "Minimalist", "Cyberpunk"

    # This allows you to add any "extra fields" later without breaking the app
    additional_context: Dict[str, Any] = Field(default_factory=dict)

    # 2. External Data (The "Mock" RAG/MCP results)
    crm_data: Dict[str, Any] = Field(default_factory=dict)

    # 3. Agent Progress
    missing_info: List[str] = Field(default_factory=list)  # List of things the Intake agent still needs
    project_brief: str = ""  # Strategy synthesis - Markdown document for user approval
    sitemap: List[Dict[str, Any]] = Field(default_factory=list)  # High-fidelity: [{title, purpose, sections}]
    prd_document: str = ""  # Populated by the PRD agent
    generated_code: str = ""  # The final HTML/Tailwind result

    # 4. Status Tracking
    current_step: str = "intake"  # intake, planning, building, etc.
    logs: List[str] = Field(default_factory=list)  # History of what has happened

    chat_history: List[Dict[str, str]] = Field(default_factory=list)

    # 5. Extended Architecture Support
    # PR-02: project_meta now has explicit structure for inferred/user_overrides
    # - project_meta["inferred"]: Dict[field_name, InferredField-like dict]
    # - project_meta["user_overrides"]: Dict[field_name, user-provided value]
    project_meta: Dict[str, Any] = Field(default_factory=_default_project_meta)
    agent_reasoning: List[AgentReasoning] = Field(default_factory=list)  # Agent thoughts and certainty levels
    seo_data: Optional[Dict[str, Any]] = None  # Keywords, meta titles, descriptions
    ux_strategy: Optional[Dict[str, Any]] = None  # User personas, conversion maps
    copywriting: Optional[Dict[str, Any]] = None  # Headlines, body text
    context_summary: str = ""  # Compressed project history
