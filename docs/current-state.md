# Current State Documentation

## 1. System Description

Clarity is a multi-agent AI-powered website builder that transforms business descriptions into complete, production-ready websites through orchestrated AI agents. The system implements a two-gate approval workflow where users provide initial business information, then review and approve work at two critical checkpoints: after sitemap generation (Gate 1) and after marketing content creation (Gate 2). Between these gates, specialized AI agents automatically handle business strategy, UX design, SEO optimization, copywriting, technical specifications, and HTML/Tailwind code generation. The entire application uses a shared `WebsiteState` object synchronized between a Python FastAPI backend (agent orchestration) and a Next.js TypeScript frontend (UI/streaming), communicating via REST API with server-sent events for real-time streaming responses.

## 2. Repository Map

```
clarity by plinng/
├── backend/                          # Python FastAPI server
│   ├── agents/                       # Multi-agent system implementation
│   │   ├── router_agent.py          # Main orchestrator (action extraction, skill chains)
│   │   ├── registry.py              # Skill registry (agent definitions & workflow)
│   │   ├── intake_agent.py          # Requirements validator
│   │   ├── strategy_agent.py        # Business goals & target audience
│   │   ├── ux_agent.py              # User personas & conversion paths
│   │   ├── planner_agent.py         # Sitemap architect
│   │   ├── seo_agent.py             # SEO keywords & meta descriptions
│   │   ├── copy_agent.py            # Marketing copy generator
│   │   ├── prd_agent.py             # Technical specification writer
│   │   └── builder_agent.py         # HTML/CSS code generator
│   ├── prompts/                      # Agent instruction templates (.txt files)
│   │   ├── router_agent.txt         # Action extraction prompt
│   │   ├── chat_response.txt        # Personality-driven chat responses
│   │   ├── intake_agent.txt         # Requirements audit prompt
│   │   ├── strategy_agent.txt       # Business strategy prompt
│   │   ├── ux_agent.txt             # UX design prompt
│   │   ├── planner_agent.txt        # Sitemap generation prompt
│   │   ├── seo_agent.txt            # SEO optimization prompt
│   │   ├── copy_agent.txt           # Copywriting prompt
│   │   ├── prd_agent.txt            # Technical PRD prompt
│   │   └── builder_agent.txt        # Code generation prompt
│   ├── main.py                       # FastAPI server entry point
│   ├── state_schema.py               # WebsiteState Pydantic model
│   ├── utils.py                      # Gemini API helpers (ask/stream/prompt loading)
│   ├── services.py                   # Mock CRM integrations
│   ├── .env                          # Environment variables (GEMINI_API_KEY)
│   └── venv/                         # Python virtual environment
│
└── frontend/                         # Next.js React application
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx             # Main application page (5 screen states)
    │   │   ├── layout.tsx           # Root layout
    │   │   ├── globals.css          # Tailwind CSS styles
    │   │   └── favicon.ico          # App icon
    │   ├── components/magic/        # Specialized UI components
    │   │   ├── HeroSection.tsx      # Initial input form
    │   │   ├── ProcessingSection.tsx # Loading animation
    │   │   ├── RefinementSection.tsx # Chat loop + tabs (sitemap/PRD/marketing)
    │   │   ├── EngineeringStream.tsx # Matrix-style build animation
    │   │   ├── BuilderSection.tsx   # Website preview (iframe)
    │   │   └── AgentTrace.tsx       # Agent reasoning visualization
    │   ├── hooks/
    │   │   └── use-orchestrator.ts  # State management & streaming API client
    │   └── lib/
    │       └── api.ts               # API utility functions
    ├── public/                       # Static assets (SVG icons)
    ├── package.json                  # Frontend dependencies
    ├── tsconfig.json                 # TypeScript configuration
    ├── next.config.ts                # Next.js configuration
    ├── postcss.config.mjs            # PostCSS configuration (Tailwind)
    └── eslint.config.mjs             # ESLint configuration
```

**Citation:** Directory structure verified via `ls` commands in `backend/` (backend/main.py:1), `backend/agents/` (backend/agents/*.py), `backend/prompts/` (backend/prompts/*.txt), `frontend/src/` (frontend/src/app/page.tsx:1), and `frontend/src/components/` (frontend/src/components/magic/).

## 3. Components

### 3.1 Backend Components

#### **FastAPI Server** (`backend/main.py`)
- **Entry Point:** `backend/main.py:12` (`app = FastAPI()`)
- **Port:** 8000 (default FastAPI/Uvicorn)
- **CORS Configuration:** Allows `http://localhost:3000` (frontend/main.py:14-20)
- **In-Memory Storage:** `project_storage = WebsiteState()` (backend/main.py:23)

**Endpoints:**
- `GET /` - Health check (backend/main.py:25-27)
- `GET /state` - Returns current WebsiteState (backend/main.py:29-31)
- `POST /update-project` - Updates project_name/industry, runs intake (backend/main.py:34-47)
- `POST /fetch-external-data` - Fetches mock CRM data (backend/main.py:51-65)
- `POST /run-planner` - Manual planner trigger (backend/main.py:67-78)
- `POST /run-prd` - Manual PRD trigger (backend/main.py:80-88)
- `POST /chat` - Main streaming endpoint (backend/main.py:90-115)

#### **Router Agent** (`backend/agents/router_agent.py`)
- **Entry Point:** `run_router_agent(state, user_message)` (backend/agents/router_agent.py:61)
- **Purpose:** Main orchestrator for all user interactions
- **Responsibilities:**
  - Extracts action (PROCEED/REVISE/CHAT) from user messages via Gemini (router_agent.py:74-93)
  - Applies state updates from AI extraction (router_agent.py:114-142)
  - Auto-fetches CRM data (router_agent.py:144-146)
  - Runs intake agent validation (router_agent.py:149-159)
  - Executes skill chain orchestration (router_agent.py:161-210)
  - Generates personality-driven chat responses (router_agent.py:212-241)
  - Compresses memory every 5 turns (router_agent.py:246-256)
  - Streams state updates via `|||STATE_UPDATE|||` marker (router_agent.py:270-271)

#### **Skill Registry** (`backend/agents/registry.py`)
- **Entry Point:** `get_registry()` singleton (backend/agents/registry.py:233-238)
- **Purpose:** Central hub for all agent capabilities
- **Registered Skills:**
  1. **Intake** (backend/agents/registry.py:71-81) - Step: `intake`, Next: `strategy`, Approval: YES
  2. **Strategy** (backend/agents/registry.py:84-94) - Step: `strategy`, Next: `ux`, Approval: NO
  3. **UX** (backend/agents/registry.py:97-107) - Step: `ux`, Next: `planning`, Approval: NO
  4. **Planning** (backend/agents/registry.py:110-120) - Step: `planning`, Next: `seo`, Approval: YES (GATE 1)
  5. **SEO** (backend/agents/registry.py:149-159) - Step: `seo`, Next: `copywriting`, Approval: NO
  6. **Copywriting** (backend/agents/registry.py:161-171) - Step: `copywriting`, Next: `prd`, Approval: YES (GATE 2)
  7. **PRD** (backend/agents/registry.py:123-133) - Step: `prd`, Next: `building`, Approval: NO
  8. **Building** (backend/agents/registry.py:136-146) - Step: `building`, Next: None, Approval: NO

**Workflow Sequence:**
```
Intake (GATE 1) → Strategy → UX → Planning (GATE 1) → SEO → Copywriting (GATE 2) → PRD → Building
```

#### **Specialized Agents**

**Intake Agent** (`backend/agents/intake_agent.py`)
- Validates required fields: `project_name`, `industry` (intake_agent.py:7-32)
- Populates `state.missing_info` list (intake_agent.py:23-24)
- Uses prompt: `backend/prompts/intake_agent.txt`

**Strategy Agent** (`backend/agents/strategy_agent.py`)
- Defines business goals, target audience, success metrics
- Outputs to `state.project_meta` (strategy_agent.py:53-59)
- Uses prompt: `backend/prompts/strategy_agent.txt`

**UX Agent** (`backend/agents/ux_agent.py`)
- Creates user personas, pain points, conversion paths
- Outputs to `state.ux_strategy` (ux_agent.py:51-57)
- Uses prompt: `backend/prompts/ux_agent.txt`

**Planner Agent** (`backend/agents/planner_agent.py`)
- Generates high-fidelity sitemap with pages, purposes, sections
- Outputs to `state.sitemap` as JSON array (planner_agent.py:68-128)
- Structure: `[{title, purpose, sections[]}]` (planner_agent.py:86-91)
- Uses prompt: `backend/prompts/planner_agent.txt`

**SEO Agent** (`backend/agents/seo_agent.py`)
- Generates keywords, meta titles, meta descriptions per page
- Outputs to `state.seo_data` (seo_agent.py:55-61)
- Uses prompt: `backend/prompts/seo_agent.txt`

**Copy Agent** (`backend/agents/copy_agent.py`)
- Generates section-specific headlines, subheaders, CTAs
- Outputs to `state.copywriting` (copy_agent.py:55-61)
- Uses prompt: `backend/prompts/copy_agent.txt`

**PRD Agent** (`backend/agents/prd_agent.py`)
- Creates comprehensive technical specifications
- Outputs to `state.prd_document` as markdown (prd_agent.py:29-31)
- Uses prompt: `backend/prompts/prd_agent.txt`

**Builder Agent** (`backend/agents/builder_agent.py`)
- Generates production-ready HTML/Tailwind CSS code
- Uses Gemini "pro" model (gemini-3-flash-preview) (builder_agent.py:32)
- Outputs to `state.generated_code` (builder_agent.py:46)
- Uses CDN resources: Tailwind CSS, Lucide Icons, Google Fonts (builder_agent.py:17)
- Uses prompt: `backend/prompts/builder_agent.txt`

#### **Utilities** (`backend/utils.py`)

**Gemini API Integration:**
- `ask_gemini(prompt, json_mode)` - Synchronous generation (utils.py:11-22)
- `stream_gemini(prompt, json_mode, model_type)` - Streaming generation (utils.py:52-85)
- **Models Used:**
  - `gemini-2.5-flash` - Default (general creation) (utils.py:18, 65)
  - `gemini-2.0-flash` - Fast chat responses (utils.py:66)
  - `gemini-3-flash-preview` - Code generation (utils.py:67)

**Prompt Management:**
- `load_prompt(agent_name)` - Loads `.txt` files from `backend/prompts/` (utils.py:24-29)
- `get_filled_prompt(agent_name, state_dict)` - Injects variables via `.format()` (utils.py:31-37)

**Memory Compression:**
- `summarize_project_context(state)` - Compresses chat history every 5 turns (utils.py:87-140)
- Outputs to `state.context_summary` (router_agent.py:251)

#### **Services** (`backend/services.py`)
- `mock_hubspot_fetcher(company_name)` - Mock CRM lookup (services.py:3-27)
- Hardcoded data for "Coffee Express" and "Fast Law" (services.py:4-15)
- Returns `None` for unknown companies (services.py:22)

#### **State Schema** (`backend/state_schema.py`)

**WebsiteState Pydantic Model:**
```python
class WebsiteState(BaseModel):
    # User Inputs
    project_name: str = ""
    industry: str = ""
    brand_colors: List[str] = []
    design_style: str = ""
    additional_context: Dict[str, Any] = {}

    # External Data
    crm_data: Dict[str, Any] = {}

    # Agent Progress
    missing_info: List[str] = []
    sitemap: List[Dict[str, Any]] = []  # [{title, purpose, sections}]
    prd_document: str = ""
    generated_code: str = ""

    # Status Tracking
    current_step: str = "intake"
    logs: List[str] = []
    chat_history: List[Dict[str, str]] = []

    # Extended Capabilities
    project_meta: Dict[str, Any] = {}  # Business strategy, inferred_fields
    agent_reasoning: List[AgentReasoning] = []
    seo_data: Optional[Dict[str, Any]] = None
    ux_strategy: Optional[Dict[str, Any]] = None
    copywriting: Optional[Dict[str, Any]] = None
    context_summary: str = ""
```

**Citation:** backend/state_schema.py:9-43

### 3.2 Frontend Components

#### **Main Application** (`frontend/src/app/page.tsx`)
- **Entry Point:** `export default function Home()` (page.tsx:11)
- **State Management:** Uses `useOrchestrator` hook (page.tsx:12)
- **Screen States:** 5 distinct UI phases based on `chatCount` and `current_step` (page.tsx:21-40)

**Screen Rendering Logic:**
1. **HeroSection** - `chatCount === 0` (page.tsx:47-50) - Initial input form
2. **ProcessingSection** - `chatCount === 2 && !isAiSpeaking` (page.tsx:54-57) - Loading animation
3. **RefinementSection** - `chatCount > 0 && isAiSpeaking` (page.tsx:61-65) - Chat loop + tabs
4. **EngineeringStream** - `showEngineeringStream` (page.tsx:68-70) - Matrix-style build phase
5. **BuilderSection** - `showFinalBuilder` (page.tsx:73-84) - Website preview with iframe

**Citations:**
- Screen state logic: frontend/src/app/page.tsx:21-40
- Screen rendering: frontend/src/app/page.tsx:44-84

#### **Orchestrator Hook** (`frontend/src/hooks/use-orchestrator.ts`)
- **Entry Point:** `export function useOrchestrator()` (use-orchestrator.ts:41)
- **State Type:** Mirrors Python `WebsiteState` (use-orchestrator.ts:21-39)
- **Main Function:** `sendMessage(input: string)` (use-orchestrator.ts:68-188)

**Streaming Protocol:**
1. Sends POST request to `http://127.0.0.1:8000/chat` (use-orchestrator.ts:78)
2. Streams chunks via `ReadableStream` (use-orchestrator.ts:84-95)
3. Detects `|||STATE_UPDATE|||` marker (use-orchestrator.ts:98-140)
4. Parses JSON state and replaces entire state (use-orchestrator.ts:103-132)
5. Detects artifact generation markers:
   - `🏗️ **Building Sitemap` → Planning phase (use-orchestrator.ts:146-155)
   - `📋 **Drafting Technical` → PRD phase (use-orchestrator.ts:157-166)
6. Cleans PRD markdown via `cleanMarkdown()` (use-orchestrator.ts:63-66, 130)

**Citations:**
- State update detection: frontend/src/hooks/use-orchestrator.ts:98-140
- Artifact markers: frontend/src/hooks/use-orchestrator.ts:143-167
- Streaming logic: frontend/src/hooks/use-orchestrator.ts:90-182

#### **UI Components** (`frontend/src/components/magic/`)

**HeroSection.tsx** - Initial input form
- Collects `project_name`, `industry`, `design_style`, `brand_colors`
- Triggers first message via `onStart(input)`

**ProcessingSection.tsx** - Loading state
- Shows animated logo while waiting for first AI response

**RefinementSection.tsx** - Chat loop + artifact tabs
- Displays chat history with markdown rendering
- Shows tabs: Sitemap, PRD, Marketing (SEO + Copy)
- Handles user input for approvals/revisions

**EngineeringStream.tsx** - Build phase animation
- Matrix-style code streaming effect
- Shows during PRD and Building phases

**BuilderSection.tsx** - Website preview
- Renders `state.generated_code` in an iframe using `srcDoc`
- Shows final website preview

**AgentTrace.tsx** - Agent reasoning visualization
- Displays `state.agent_reasoning` for transparency

**Citations:**
- Component directory: frontend/src/components/magic/
- Usage in page.tsx: frontend/src/app/page.tsx:3-8

## 4. Data Flow: Website Generation Lifecycle

### 4.1 Complete Workflow Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: INTAKE & VALIDATION                                        │
│ Step: "intake"                                                      │
└─────────────────────────────────────────────────────────────────────┘
1. User enters business info in HeroSection (page.tsx:49)
2. Frontend calls sendMessage() (use-orchestrator.ts:68)
3. POST /chat → Router Agent (main.py:90-115)
4. Router extracts updates via Gemini (router_agent.py:74-93)
5. Router applies updates to state (router_agent.py:114-142)
6. Router auto-fetches CRM data (router_agent.py:144-146)
7. Router runs Intake Agent validation (router_agent.py:149-159)
8. Intake Agent checks for missing_info (intake_agent.py:7-32)
9. Router generates chat response (router_agent.py:212-241)
10. Router streams state via |||STATE_UPDATE||| (router_agent.py:270-271)
11. Frontend updates state and shows RefinementSection (use-orchestrator.ts:127-132)

🚪 **GATE 1:** User must say "proceed" or similar to continue

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: AUTOMATIC STRATEGY CHAIN                                   │
│ Steps: "strategy" → "ux" → "planning"                              │
└─────────────────────────────────────────────────────────────────────┘
12. User approves → Router detects PROCEED action (router_agent.py:168)
13. Router calls _execute_skill_chain() (router_agent.py:9-59)
14. Strategy Agent runs automatically (registry.py:88, requires_approval=False)
    - Defines business goals, target audience
    - Outputs to state.project_meta (strategy_agent.py:53-59)
15. Chain auto-advances to UX Agent (registry.py:90, next_step="ux")
16. UX Agent runs automatically (registry.py:103, requires_approval=False)
    - Creates user personas, conversion paths
    - Outputs to state.ux_strategy (ux_agent.py:51-57)
17. Chain auto-advances to Planning Agent (registry.py:103, next_step="planning")
18. Planning Agent executes (registry.py:114, requires_approval=True)
    - Frontend detects "🏗️ **Building Sitemap" marker (use-orchestrator.ts:146)
    - Generates high-fidelity sitemap with pages/sections (planner_agent.py:68-128)
    - Outputs to state.sitemap (planner_agent.py:100)
19. Chain PAUSES at Planning (GATE 1) (router_agent.py:48-50)
20. Router streams state update with sitemap (router_agent.py:270-271)
21. Frontend shows sitemap in RefinementSection tabs (page.tsx:62)

🚪 **GATE 1:** User reviews sitemap, must approve to continue

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: AUTOMATIC MARKETING CHAIN                                  │
│ Steps: "seo" → "copywriting"                                       │
└─────────────────────────────────────────────────────────────────────┘
22. User approves sitemap → Router detects PROCEED action
23. Router calls _execute_skill_chain() from "planning" (router_agent.py:179)
24. SEO Agent runs automatically (registry.py:156, requires_approval=False)
    - Generates keywords, meta titles, meta descriptions per page
    - Outputs to state.seo_data (seo_agent.py:55-61)
25. Chain auto-advances to Copywriting Agent (registry.py:155, next_step="copywriting")
26. Copy Agent executes (registry.py:168, requires_approval=True)
    - Generates section headlines, subheaders, CTAs
    - Outputs to state.copywriting (copy_agent.py:55-61)
27. Chain PAUSES at Copywriting (GATE 2) (router_agent.py:48-50)
28. Router streams state update with marketing data (router_agent.py:270-271)
29. Frontend shows Marketing tab with SEO + Copy (page.tsx:62)

🚪 **GATE 2:** User reviews marketing content, must approve to build

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: AUTOMATIC BUILD CHAIN                                      │
│ Steps: "prd" → "building"                                          │
└─────────────────────────────────────────────────────────────────────┘
30. User approves marketing → Router detects PROCEED action
31. Router calls _execute_skill_chain() from "copywriting" (router_agent.py:179)
32. PRD Agent runs automatically (registry.py:130, requires_approval=False)
    - Frontend detects "📋 **Drafting Technical" marker (use-orchestrator.ts:157)
    - Frontend shows EngineeringStream animation (page.tsx:68-70)
    - Creates comprehensive technical PRD
    - Outputs to state.prd_document (prd_agent.py:29-31)
33. Chain auto-advances to Building Agent (registry.py:129, next_step="building")
34. Builder Agent executes (registry.py:143, requires_approval=False)
    - Frontend detects "🚀 **Starting Build" marker (router_agent.py:40)
    - Uses all specialist data: SEO, Copy, UX, Strategy, PRD (builder_agent.py:20-23)
    - Generates HTML/Tailwind code via Gemini "pro" (builder_agent.py:32)
    - Outputs to state.generated_code (builder_agent.py:46)
35. Chain completes (registry.py:142, next_step=None)
36. Router streams final state update (router_agent.py:270-271)
37. Frontend shows BuilderSection with iframe preview (page.tsx:73-84)

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: PREVIEW & EXPORT                                           │
│ Step: "building" (completed)                                        │
└─────────────────────────────────────────────────────────────────────┘
38. BuilderSection renders generated_code in iframe using srcDoc
39. User can view final website
40. (Export functionality not yet implemented)
```

**Citations:**
- Skill chain execution: backend/agents/router_agent.py:9-59
- Phase gates: backend/agents/registry.py:117 (GATE 1), registry.py:168 (GATE 2)
- Frontend phase detection: frontend/src/app/page.tsx:33-40
- Artifact markers: backend/agents/router_agent.py:35-42, frontend/src/hooks/use-orchestrator.ts:143-167

### 4.2 State Transitions

**Step Progression:**
```
intake → strategy → ux → planning → seo → copywriting → prd → building
```

**Current Step Logic:**
- Set by skill registry's `next_step` (registry.py:34)
- Advanced by `_execute_skill_chain()` (router_agent.py:18-19)
- Pauses at `requires_approval=True` skills (router_agent.py:48-50)

**Citations:**
- Skill definitions: backend/agents/registry.py:71-171
- Step transitions: backend/agents/router_agent.py:15-59

## 5. TypeScript ↔ Python Boundary

### 5.1 Communication Protocol

**Transport:** HTTP REST API with Server-Sent Events (SSE)
- Frontend → Backend: `POST http://127.0.0.1:8000/chat` (use-orchestrator.ts:78)
- Backend → Frontend: `StreamingResponse` with `text/event-stream` (main.py:106-114)

**Citation:** Communication setup in backend/main.py:106-115 and frontend/src/hooks/use-orchestrator.ts:78-82

### 5.2 Request Schema

**Frontend Request:**
```typescript
{
  message: string  // User input text
}
```

**Citation:** frontend/src/hooks/use-orchestrator.ts:81

**Backend Handling:**
```python
@app.post("/chat")
async def chat(message_data: dict = Body(...)):
    user_text = message_data.get("message", "")
    project_storage.chat_history.append({"role": "user", "content": user_text})
    return StreamingResponse(run_router_agent(project_storage, user_text), ...)
```

**Citation:** backend/main.py:90-115

### 5.3 Response Protocol

**Streaming Format:**
```
[CHUNK 1] " " (heartbeat)
[CHUNK 2...N] Chat response text (streamed)
[CHUNK N+1] Artifact markers (optional):
  - "🏗️ **Building Sitemap**\n\n"
  - "📋 **Drafting Technical Spec**\n\n"
  - "🚀 **Starting Build**\n\n"
[CHUNK N+2] "\n\n|||STATE_UPDATE|||\n"
[CHUNK N+3] JSON state (complete WebsiteState)
```

**Citation:**
- Heartbeat: backend/agents/router_agent.py:63
- Artifact markers: backend/agents/router_agent.py:35-42
- State delimiter: backend/agents/router_agent.py:270-271
- Frontend parsing: frontend/src/hooks/use-orchestrator.ts:90-182

### 5.4 State Synchronization

**Marker Detection:**
```typescript
if (fullStreamContent.includes("|||STATE_UPDATE|||")) {
  const parts = fullStreamContent.split("|||STATE_UPDATE|||");
  const jsonString = parts[1].trim();
  const newState = JSON.parse(jsonString);
  setState((prev) => ({ ...prev, ...newState, ... }));
}
```

**Citation:** frontend/src/hooks/use-orchestrator.ts:98-140

**State Serialization:**
```python
state_dict = state.model_dump()  # Pydantic → dict
final_json = json.dumps(state_dict, ensure_ascii=False)
yield "\n\n|||STATE_UPDATE|||\n"
yield final_json
```

**Citation:** backend/agents/router_agent.py:259-271

### 5.5 Shared Contract: WebsiteState

**Python Schema** (backend/state_schema.py:9-43):
```python
class WebsiteState(BaseModel):
    project_name: str = ""
    industry: str = ""
    brand_colors: List[str] = []
    design_style: str = ""
    additional_context: Dict[str, Any] = {}
    crm_data: Dict[str, Any] = {}
    missing_info: List[str] = []
    sitemap: List[Dict[str, Any]] = []
    prd_document: str = ""
    generated_code: str = ""
    current_step: str = "intake"
    logs: List[str] = []
    chat_history: List[Dict[str, str]] = []
    project_meta: Dict[str, Any] = {}
    agent_reasoning: List[AgentReasoning] = []
    seo_data: Optional[Dict[str, Any]] = None
    ux_strategy: Optional[Dict[str, Any]] = None
    copywriting: Optional[Dict[str, Any]] = None
    context_summary: str = ""
```

**TypeScript Interface** (frontend/src/hooks/use-orchestrator.ts:21-39):
```typescript
export interface WebsiteState {
  project_name: string;
  industry: string;
  brand_colors: string[];
  design_style: string;
  missing_info: string[];
  logs: string[];
  current_step: string;
  sitemap: SitemapPage[];  // [{title, purpose, sections}]
  prd_document: string;
  generated_code: string;
  chat_history: Message[];
  project_meta: Record<string, any>;
  agent_reasoning: AgentReasoning[];
  seo_data?: Record<string, any> | null;
  ux_strategy?: Record<string, any> | null;
  copywriting?: Record<string, any> | null;
  context_summary: string;
}
```

**Type Mappings:**
- Python `List[str]` ↔ TypeScript `string[]`
- Python `Dict[str, Any]` ↔ TypeScript `Record<string, any>`
- Python `Optional[Dict]` ↔ TypeScript `Record<...> | null | undefined`
- Python `List[Dict[str, Any]]` ↔ TypeScript `SitemapPage[]` (structured interface)

**Citation:** Schema defined in backend/state_schema.py:9-43 and frontend/src/hooks/use-orchestrator.ts:21-39

### 5.6 Special Markers & Signals

**Artifact Generation Detection:**

Frontend detects specific strings in the stream to trigger phase transitions:

```typescript
if (fullStreamContent.includes("🏗️ **Building Sitemap")) {
  setState({ ...prev, current_step: "planning", chat_history: [..., {role: "assistant", content: "[GENERATING_SITEMAP]"}] });
}

if (fullStreamContent.includes("📋 **Drafting Technical")) {
  setState({ ...prev, current_step: "prd", chat_history: [..., {role: "assistant", content: "[GENERATING_PRD]"}] });
}
```

**Citation:** frontend/src/hooks/use-orchestrator.ts:146-166

**Backend Emission:**
```python
if next_step == "planning":
    yield "🏗️ **Building Sitemap**\n\n"
elif next_step == "prd":
    yield "📋 **Drafting Technical Spec**\n\n"
elif next_step == "building":
    yield "🚀 **Starting Build**\n\n"
```

**Citation:** backend/agents/router_agent.py:35-42

## 6. Dependencies

### 6.1 Backend Dependencies

**Python Version:** Python 3.11+ (inferred from venv structure at backend/venv/)

**Core Libraries:**
- **FastAPI** - ASGI web framework (main.py:2)
- **Pydantic** - Data validation via BaseModel (state_schema.py:1)
- **Uvicorn** - ASGI server (implied by FastAPI usage)
- **python-dotenv** - Environment variable loading (utils.py:3, 6)
- **google-genai** - Google Gemini API client (utils.py:2, 9)

**API Configuration:**
- **Environment File:** `backend/.env` (located via `ls backend/.env`)
- **Required Variable:** `GEMINI_API_KEY` (utils.py:9)
- **API Endpoint:** Google Gemini API (utils.py:9, 18)

**AI Models Used:**
- `gemini-2.5-flash` - General creation, sitemap, PRD (utils.py:18, 65)
- `gemini-2.0-flash` - Fast chat responses (utils.py:66)
- `gemini-3-flash-preview` - Code generation (builder_agent.py:32, utils.py:67)

**Citation:** Dependencies imported in backend/main.py:2-10, backend/utils.py:1-9, backend/state_schema.py:1-2

**No Requirements File:** No `requirements.txt` found via `find` command, dependencies inferred from imports

### 6.2 Frontend Dependencies

**Package Manager:** npm (package-lock.json present at frontend/package-lock.json)

**Core Dependencies** (frontend/package.json:11-19):
- `next@16.1.1` - React framework
- `react@19.2.3` - UI library
- `react-dom@19.2.3` - React DOM renderer
- `framer-motion@^12.23.26` - Animation library
- `lucide-react@^0.562.0` - Icon library
- `react-markdown@^10.1.0` - Markdown rendering
- `remark-gfm@^4.0.1` - GitHub Flavored Markdown support

**Dev Dependencies** (frontend/package.json:20-30):
- `@tailwindcss/postcss@^4` - Tailwind CSS v4 PostCSS plugin
- `@tailwindcss/typography@^0.5.19` - Prose styling
- `@types/node@^20` - Node.js TypeScript types
- `@types/react@^19` - React TypeScript types
- `@types/react-dom@^19` - React DOM TypeScript types
- `eslint@^9` - Linting
- `eslint-config-next@16.1.1` - Next.js ESLint config
- `tailwindcss@^4` - Utility-first CSS framework
- `typescript@^5` - TypeScript compiler

**Citation:** frontend/package.json:11-30

### 6.3 Infrastructure & Storage

**Database:** None (in-memory storage only)
- State stored in global variable: `project_storage = WebsiteState()` (main.py:23)
- Persistence: Data lost on server restart
- Concurrency: Single-user only (global state shared across all requests)

**Queue System:** None
- All agent execution is synchronous/streaming

**File Storage:** None
- Generated code stored in memory (`state.generated_code`)
- No export functionality implemented yet

**Authentication:** None
- No user accounts or API authentication
- CORS restricted to `http://localhost:3000` (main.py:16)

**External APIs:**
- Google Gemini API (production dependency) (utils.py:9)
- Mock CRM API (simulated, not real) (services.py:3)

**Citation:** In-memory storage at backend/main.py:23, no database imports found in codebase

### 6.4 Configuration Files

**Backend:**
- `backend/.env` - Contains `GEMINI_API_KEY` (utils.py:9, .gitignore:38)
- No other configuration files (no config.py, settings.py, etc.)

**Frontend:**
- `frontend/next.config.ts` - Next.js configuration (default, empty) (next.config.ts:3-5)
- `frontend/tsconfig.json` - TypeScript compiler options (tsconfig.json:1-34)
  - Path aliases: `@/*` → `./src/*` (tsconfig.json:21-23)
  - Target: ES2017 (tsconfig.json:3)
  - JSX: react-jsx (tsconfig.json:14)
- `frontend/postcss.config.mjs` - PostCSS configuration for Tailwind (postcss.config.mjs)
- `frontend/eslint.config.mjs` - ESLint configuration (eslint.config.mjs)

**Version Control:**
- `.gitignore` - Excludes node_modules, .next, venv, .env, __pycache__ (.gitignore:1-56)

**Citation:** Configuration files found via `ls` commands and file reads

## 7. How to Run

### 7.1 Local Development Setup

**Prerequisites:**
- Python 3.11 or higher
- Node.js 20 or higher (inferred from @types/node@^20 in package.json:23)
- npm package manager
- Google Gemini API key

**Citation:** Python version inferred from venv at backend/venv/, Node.js version from frontend/package.json:23

### 7.2 Backend Setup

**Step 1: Navigate to backend directory**
```bash
cd backend
```

**Step 2: Create/activate virtual environment**
```bash
# Virtual environment exists at backend/venv/ (verified via ls backend/venv/)
# On Windows:
venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate
```

**Citation:** venv directory found at backend/venv/ via ls command

**Step 3: Install dependencies**
```bash
# No requirements.txt found, dependencies must be installed manually:
pip install fastapi uvicorn pydantic python-dotenv google-genai
```

**Citation:** Dependencies inferred from imports in backend/main.py:2-10, backend/utils.py:1-9

**Step 4: Configure environment**
```bash
# Create .env file in backend/ directory
# Add your Gemini API key:
echo "GEMINI_API_KEY=your_key_here" > .env
```

**Citation:** Environment variable loaded in backend/utils.py:6-9

**Step 5: Start the FastAPI server**
```bash
# Default command (must be run from backend/ directory):
uvicorn main:app --reload

# Server starts on http://127.0.0.1:8000
```

**Citation:** FastAPI app instance at backend/main.py:12, standard Uvicorn usage pattern

**Verify backend is running:**
```bash
curl http://127.0.0.1:8000/
# Expected response: {"status": "Backend is online"}
```

**Citation:** Health check endpoint at backend/main.py:25-27

### 7.3 Frontend Setup

**Step 1: Navigate to frontend directory**
```bash
cd frontend
```

**Step 2: Install dependencies**
```bash
npm install
```

**Citation:** Package manager inferred from package-lock.json presence, dependencies listed in frontend/package.json:11-30

**Step 3: Start development server**
```bash
npm run dev
# Starts on http://localhost:3000
```

**Citation:** Dev script defined in frontend/package.json:6 as "next dev", default Next.js README at frontend/README.md:7-15

**Alternative package managers:**
```bash
# Using yarn:
yarn dev

# Using pnpm:
pnpm dev

# Using bun:
bun dev
```

**Citation:** Alternative commands from frontend/README.md:10-14

**Verify frontend is running:**
- Open http://localhost:3000 in browser
- Should see HeroSection with input form

**Citation:** CORS allows localhost:3000 in backend/main.py:16, HeroSection renders when chatCount === 0 in frontend/src/app/page.tsx:47-50

### 7.4 Full System Startup

**Terminal 1 (Backend):**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Unix/macOS
uvicorn main:app --reload
# Server: http://127.0.0.1:8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Server: http://localhost:3000
```

**Usage Flow:**
1. Open http://localhost:3000
2. Enter business information in the form
3. Follow the two-gate approval workflow
4. Review sitemap (Gate 1) → Approve
5. Review marketing content (Gate 2) → Approve
6. View generated website preview

**Citation:** Two-gate workflow defined in backend/agents/registry.py:117-171, UI screens in frontend/src/app/page.tsx:44-84

### 7.5 Testing

**No test files found** via `find . -name "*test*" -o -name "*spec*"` in non-node_modules directories.

**Citation:** No test infrastructure exists in the current codebase

### 7.6 Deployment

**No deployment configuration found:**
- No Dockerfile
- No docker-compose.yml
- No deployment scripts
- No CI/CD configuration (.github/workflows/, .gitlab-ci.yml, etc.)
- No production environment files

**Frontend production build:**
```bash
cd frontend
npm run build
npm start
# Builds optimized production bundle
# Starts production server
```

**Citation:** Build/start scripts in frontend/package.json:7-8, standard Next.js deployment from frontend/README.md:32-36

**Backend production:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
# No production-specific configuration found
```

**Citation:** No production configuration exists, standard Uvicorn usage

**Known deployment gaps:**
- No database persistence (in-memory only) (main.py:23)
- No user authentication/multi-tenancy
- Hardcoded localhost URLs (use-orchestrator.ts:78, main.py:16)
- No environment-based configuration (staging/production)
- No scaling strategy (single-process, in-memory state)

## 8. Current Limitations & Known Issues

### 8.1 Architecture Limitations

**1. In-Memory State (No Persistence)**
- **Evidence:** `project_storage = WebsiteState()` global variable (main.py:23)
- **Impact:** All data lost on server restart, no persistence between sessions
- **Scope:** Single-user only, shared state across all concurrent requests
- **Citation:** backend/main.py:23

**2. No User Authentication/Multi-Tenancy**
- **Evidence:** No authentication imports, no user model in state_schema.py
- **Impact:** Cannot support multiple users simultaneously, no project isolation
- **Citation:** No auth-related code in backend/main.py or state_schema.py

**3. Hardcoded Backend URL**
- **Evidence:** `fetch("http://127.0.0.1:8000/chat", ...)` (use-orchestrator.ts:78)
- **Impact:** Frontend cannot connect to deployed backend without code changes
- **Citation:** frontend/src/hooks/use-orchestrator.ts:78

**4. CORS Restricted to Localhost**
- **Evidence:** `allow_origins=["http://localhost:3000"]` (main.py:16)
- **Impact:** Cannot access API from production frontend domain
- **Citation:** backend/main.py:16

### 8.2 Data Model Issues

**5. Mock CRM Integration**
- **Evidence:** Hardcoded data for "Coffee Express" and "Fast Law" only (services.py:4-15)
- **Evidence:** Returns `None` for all other company names (services.py:22)
- **Impact:** CRM fetching only works for 2 test companies
- **Citation:** backend/services.py:3-27

**6. Incomplete Fallback Data**
- **Evidence:** Commented-out generic fallback (services.py:22-27)
- **Impact:** Unknown companies get no CRM data, may cause validation issues
- **Citation:** backend/services.py:22-27

**7. No Export Functionality**
- **Evidence:** Generated code only stored in `state.generated_code` (builder_agent.py:46)
- **Impact:** Users cannot download HTML/CSS files, code lost on refresh
- **Citation:** backend/agents/builder_agent.py:46, no export endpoints in main.py

### 8.3 Error Handling Gaps

**8. No Streaming Error Recovery**
- **Evidence:** Try/catch in `stream_gemini()` yields error string (utils.py:84-85)
- **Evidence:** No retry logic for failed API calls
- **Impact:** Single Gemini API failure breaks entire workflow
- **Citation:** backend/utils.py:84-85

**9. Generic Fallback Sitemap**
- **Evidence:** Hardcoded 4-page fallback on planner error (planner_agent.py:122-128)
- **Impact:** User gets generic sitemap on failures, no visibility into error
- **Citation:** backend/agents/planner_agent.py:122-128

**10. No Frontend Error States**
- **Evidence:** Catch block only logs to console (use-orchestrator.ts:183-184)
- **Impact:** Users see no error UI when backend fails
- **Citation:** frontend/src/hooks/use-orchestrator.ts:183-184

### 8.4 Concurrency & Race Conditions

**11. Global State Race Condition**
- **Evidence:** All requests modify single `project_storage` (main.py:23)
- **Evidence:** `global project_storage` in multiple endpoints (main.py:36, 53, 69, 92)
- **Impact:** Concurrent users overwrite each other's data
- **Citation:** backend/main.py:23, 36, 53, 69, 92

**12. No Request Isolation**
- **Evidence:** State modifications happen in-place without locks
- **Impact:** Parallel requests can corrupt state mid-stream
- **Citation:** All agent modifications to `state` object in backend/agents/

### 8.5 Memory & Performance Issues

**13. Unbounded Chat History**
- **Evidence:** `chat_history.append()` without limit (main.py:99, router_agent.py:243)
- **Evidence:** Compression only triggered every 5 turns (router_agent.py:247)
- **Impact:** Memory grows unbounded with long conversations
- **Citation:** backend/main.py:99, backend/agents/router_agent.py:243-256

**14. No Token Limit Handling**
- **Evidence:** No max_tokens parameter in Gemini calls (utils.py:17-21, 74-78)
- **Impact:** Responses may be truncated without warning
- **Citation:** backend/utils.py:17-21, 74-78

**15. Logs Array Never Cleared**
- **Evidence:** `state.logs.append()` throughout agents, no cleanup (e.g., planner_agent.py:103)
- **Impact:** Logs array grows unbounded, increases state size
- **Citation:** Multiple files (e.g., backend/agents/planner_agent.py:103)

### 8.6 Incomplete Features

**16. No Website Export**
- **Evidence:** BuilderSection only shows iframe preview (page.tsx:73-84)
- **Evidence:** No download button or export endpoint
- **Impact:** Users cannot save generated websites
- **Citation:** frontend/src/app/page.tsx:73-84, no export in backend/main.py

**17. No Revision History**
- **Evidence:** `state.sitemap` replaced on each planner run (planner_agent.py:100)
- **Impact:** Cannot undo changes or compare versions
- **Citation:** backend/agents/planner_agent.py:100

**18. Limited Revision Support**
- **Evidence:** Feedback passed as string, no structured diff (planner_agent.py:5, 12)
- **Impact:** AI must interpret vague user feedback
- **Citation:** backend/agents/planner_agent.py:5-16

### 8.7 Code Quality Issues

**19. Inconsistent Error Handling**
- **Evidence:** Some agents have try/catch (planner_agent.py:53-128), others don't
- **Impact:** Inconsistent error recovery behavior
- **Citation:** backend/agents/planner_agent.py:53-128 vs other agents

**20. Commented-Out Code**
- **Evidence:** Generic CRM fallback commented (services.py:22-27)
- **Evidence:** Duplicate router call in main.py (main.py:103, unused)
- **Impact:** Code confusion, unclear intentionality
- **Citation:** backend/services.py:22-27, backend/main.py:103

**21. Windows File Handling Bug**
- **Evidence:** `.gitignore` excludes "nul" file (gitignore:54-55)
- **Evidence:** `nul` file exists in root directory (ls output)
- **Impact:** Windows reserved device name accidentally created
- **Citation:** .gitignore:54-55, ls output showing `nul` file

### 8.8 Security Concerns

**22. No API Key Validation**
- **Evidence:** `os.getenv("GEMINI_API_KEY")` used directly (utils.py:9)
- **Evidence:** No startup check for missing key
- **Impact:** Server starts but fails silently on first API call
- **Citation:** backend/utils.py:9

**23. No Rate Limiting**
- **Evidence:** No rate limiting middleware or decorators
- **Impact:** Single user can exhaust Gemini API quota
- **Citation:** No rate limiting code found in backend/main.py

**24. CORS Allows Credentials**
- **Evidence:** `allow_credentials=True` (main.py:17)
- **Impact:** Unnecessary exposure (no auth system exists)
- **Citation:** backend/main.py:17

### 8.9 Developer Experience Issues

**25. No Requirements File**
- **Evidence:** `find` command returned no `requirements.txt` in backend/
- **Impact:** Developers must manually infer dependencies from imports
- **Citation:** No requirements.txt found via `find` command

**26. No Installation Instructions**
- **Evidence:** No README.md at repository root
- **Evidence:** Frontend README is generic Next.js boilerplate (README.md:1-37)
- **Impact:** New developers have no setup guide
- **Citation:** frontend/README.md:1-37 (generic), no root README

**27. No Development Environment File**
- **Evidence:** `.env` in .gitignore but no `.env.example` (gitignore:38)
- **Impact:** Developers don't know what environment variables are needed
- **Citation:** .gitignore:38, no .env.example found

### 8.10 Type Safety Issues

**28. Loose Dict Types**
- **Evidence:** `Dict[str, Any]` used extensively (state_schema.py:19, 22, 26, 37, 39-41)
- **Impact:** No validation for nested structures like sitemap, seo_data, etc.
- **Citation:** backend/state_schema.py:19, 22, 26, 37, 39-41

**29. Frontend-Backend Type Mismatch**
- **Evidence:** Python `List[Dict[str, Any]]` vs TypeScript `SitemapPage[]` (state_schema.py:26, use-orchestrator.ts:15-19)
- **Impact:** No compile-time validation that schemas match
- **Citation:** backend/state_schema.py:26, frontend/src/hooks/use-orchestrator.ts:15-19

### 8.11 Workflow Limitations

**30. No Skip/Jump Between Phases**
- **Evidence:** Linear skill chain enforced by registry (registry.py:71-171)
- **Impact:** Cannot skip unwanted phases (e.g., user wants no SEO)
- **Citation:** backend/agents/registry.py:71-171

**31. Two-Gate Only Design**
- **Evidence:** Only planning and copywriting require approval (registry.py:117, 168)
- **Impact:** Cannot review strategy, UX, PRD, or building phases before execution
- **Citation:** backend/agents/registry.py:117, 168

**32. No Parallel Agent Execution**
- **Evidence:** Sequential execution in `_execute_skill_chain()` (router_agent.py:9-59)
- **Impact:** SEO and Copy agents could run in parallel but don't
- **Citation:** backend/agents/router_agent.py:9-59

### 8.12 AI Prompt Issues

**33. Hardcoded Format Instructions**
- **Evidence:** JSON format instructions hardcoded in agent code (planner_agent.py:21-40)
- **Impact:** Cannot adjust format without code changes
- **Citation:** backend/agents/planner_agent.py:21-40

**34. No Temperature Control**
- **Evidence:** No temperature parameter in Gemini calls (utils.py:17-21, 74-78)
- **Impact:** Cannot control AI creativity/determinism
- **Citation:** backend/utils.py:17-21, 74-78

**35. No Prompt Versioning**
- **Evidence:** Prompts stored as `.txt` files with no version metadata
- **Impact:** Cannot track prompt changes or A/B test
- **Citation:** backend/prompts/ directory contains only .txt files

---

**End of Current State Documentation**

*Last Updated: 2026-01-13*
*Generated via codebase exploration and file analysis*
*Total Files Analyzed: 30+ across backend/ and frontend/*

