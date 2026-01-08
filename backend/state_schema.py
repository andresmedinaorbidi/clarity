from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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
    sitemap: List[Dict[str, Any]] = []  # High-fidelity: [{title, purpose, sections}]
    prd_document: str = ""        # Populated by the PRD agent
    generated_code: str = ""      # The final HTML/Tailwind result

    # 4. Status Tracking
    current_step: str = "intake"  # intake, planning, building, etc.
    logs: List[str] = []          # History of what has happened

    chat_history: List[Dict[str, str]] = []

    # 5. Extended Architecture Support
    project_meta: Dict[str, Any] = {}  # Brand guidelines, target audience, business goals, inferred_fields: List[str]
    agent_reasoning: List[AgentReasoning] = []  # Agent thoughts and certainty levels
    seo_data: Optional[Dict[str, Any]] = None  # Keywords, meta titles, descriptions
    ux_strategy: Optional[Dict[str, Any]] = None  # User personas, conversion maps
    copywriting: Optional[Dict[str, Any]] = None  # Headlines, body text
    context_summary: str = ""  # Compressed project history
