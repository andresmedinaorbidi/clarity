# System Artifact

> High-level system reference document.
> Its purpose is to provide **compressed, high-signal context** for humans and LLMs.
> It does NOT replace code or detailed documentation.

---

## 1. Overview

### 1.1 Purpose

Clarity is a multi-agent AI-powered website builder that transforms business descriptions into complete, production-ready websites through orchestrated AI agents. The system enables users to provide initial business information and receive a fully generated website through a two-gate approval workflow, where specialized AI agents automatically handle strategy, UX design, SEO optimization, copywriting, technical specifications, and HTML/Tailwind code generation.

### 1.2 Non-Goals

* Does not handle user authentication or multi-user accounts (session-based isolation only)
* Does not include payment processing or subscription management
* Does not optimize for high concurrency (single-process, SQLite database)
* Does not provide website hosting or deployment services
* Does not support real-time collaboration between multiple users
* Does not include version control or revision history for generated websites
* Does not handle advanced authentication or OAuth integration

---

## 2. Architectural Style

### 2.1 Architecture Pattern

* **Intent-Driven Multi-Agent Architecture** with Skill Registry
* **Session-Based State Management** (SQLite persistence)
* **Streaming API Communication** (Server-Sent Events)

### 2.2 Core Principles

* Domain logic is independent of frameworks (Pydantic models)
* State synchronization via shared `WebsiteState` object with `|||STATE_UPDATE|||` markers
* Intent-driven skill invocation (users can trigger skills directly via natural language)
* Linear progression still supported via `PROCEED` actions
* Skills are registered in a central registry with prerequisites and trigger phrases
* Two-gate approval workflow: Intake/Blueprint (Gate 1) and Marketing (Gate 2)
* Memory compression every 5 chat turns to manage token usage

---

## 3. High-Level Structure

```
/clarity by plinng
├── backend/                    # Python FastAPI server
│   ├── agents/                 # Multi-agent system
│   │   ├── router_agent.py     # Main orchestrator (intent analysis, skill execution)
│   │   ├── registry.py         # Skill registry (central hub for all agent capabilities)
│   │   ├── intent_analyzer.py  # Intent extraction from user messages
│   │   ├── state_orchestrator.py # State update coordination
│   │   ├── skill_executor.py   # Skill execution wrapper
│   │   ├── intake_agent.py     # Requirements validator
│   │   ├── research_agent.py   # Business research (web scraping, AI inference)
│   │   ├── strategy_agent.py   # Project Brief synthesis
│   │   ├── ux_agent.py         # User personas & conversion paths
│   │   ├── planner_agent.py    # Sitemap architect
│   │   ├── seo_agent.py        # SEO keywords & meta descriptions
│   │   ├── copy_agent.py       # Marketing copy generator
│   │   ├── prd_agent.py        # Technical specification writer
│   │   └── builder_agent.py    # HTML/CSS code generator
│   ├── helpers/                # Utility modules
│   │   ├── chat_response_generator.py # Personality-driven chat responses
│   │   ├── field_updater.py    # State field updates
│   │   └── step_transitions.py # Step progression logic
│   ├── prompts/                # Agent instruction templates (.txt files)
│   ├── main.py                 # FastAPI server entry point
│   ├── state_schema.py         # WebsiteState Pydantic model
│   ├── database.py             # SQLAlchemy session persistence
│   ├── constants.py            # Step names, markers, gate names
│   ├── utils.py                # Gemini API helpers
│   └── services.py             # Mock CRM integrations
│
└── frontend/                   # Next.js React application
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # Main application (HeroSection → FlowShell)
    │   │   ├── layout.tsx      # Root layout
    │   │   └── globals.css     # Tailwind CSS styles
    │   ├── components/magic/   # Specialized UI components
    │   │   ├── HeroSection.tsx      # Initial input form
    │   │   ├── FlowShell.tsx        # Main workspace shell (post-hero flow)
    │   │   ├── WorkspaceView.tsx    # Legacy split-view (deprecated)
    │   │   ├── ChatInterface.tsx    # Chat loop
    │   │   ├── ArtifactWorkspace.tsx # Artifact tabs (Sitemap, PRD, Marketing)
    │   │   ├── BuilderSection.tsx   # Website preview (iframe)
    │   │   └── AgentTrace.tsx       # Agent reasoning visualization
    │   ├── components/intake/  # Guided intake flow components
    │   │   ├── GuidedIntakeView.tsx # Main intake container (data priority logic)
    │   │   ├── ChipPicker.tsx       # Selectable chip options (industry, etc.)
    │   │   ├── ColorPicker.tsx      # Brand color selection with presets
    │   │   ├── FontPicker.tsx       # Typography style selection
    │   │   ├── StyleCard.tsx        # Visual design style cards
    │   │   └── index.ts             # Barrel exports
    │   ├── hooks/
    │   │   └── use-orchestrator.ts  # State management & streaming API client
    │   ├── contexts/
    │   │   └── AdvancedModeContext.tsx # Advanced mode toggle
    │   └── lib/
    │       ├── api.ts          # API utility functions
    │       ├── constants.ts    # Frontend constants
    │       ├── extractors.ts  # State extraction utilities
    │       └── stateParser.ts # State parsing utilities
```

**Key Directories:**

* **backend/agents/**: Multi-agent system with intent-driven skill registry
* **backend/prompts/**: Agent instruction templates (loaded dynamically)
* **backend/helpers/**: Modular utilities for chat, state updates, transitions
* **frontend/src/components/magic/**: Specialized UI components for each phase
* **frontend/src/components/intake/**: Guided intake picker components (chips, colors, fonts, styles)
* **frontend/src/hooks/**: State management and API communication

---

## 4. Core Domain Model

### 4.1 Main Entities

* **WebsiteState**: Central state object shared between backend and frontend
  * Contains user inputs, agent outputs, status tracking, chat history
  * Persisted per session in SQLite database
  * Synchronized via SSE with `|||STATE_UPDATE|||` markers

* **Skill**: Agent capability definition
  * Has ID, name, description, trigger phrases
  * Supports direct invocation and linear progression
  * Has prerequisites, approval requirements, auto-execution flags

* **Session**: User session isolation
  * Each session gets unique `session_id` (UUID)
  * State stored in `project_states` table (SQLite)
  * Frontend sends `X-Session-ID` header for state isolation

* **ProjectMeta**: Structured metadata container
  * `inferred`: Dict of agent-inferred values with metadata
  * `user_overrides`: Dict of user-provided values (take precedence)

* **InferredField**: Metadata for inferred values
  * `value`: The inferred value (any type)
  * `confidence`: Float 0-1 indicating certainty
  * `source`: Agent that inferred the value (e.g., "research_agent")
  * `rationale`: Explanation of inference reasoning

### 4.2 Key Attributes

**WebsiteState** (backend/state_schema.py):
* `project_name`, `industry`, `brand_colors`, `design_style` (user inputs)
* `crm_data` (external data from mock CRM)
* `missing_info` (validation results from intake agent)
* `project_brief` (strategy synthesis - Markdown document)
* `sitemap` (high-fidelity: `[{title, purpose, sections}]`)
* `prd_document` (technical specification - Markdown)
* `generated_code` (final HTML/Tailwind CSS)
* `current_step` (workflow step: intake, research, strategy, ux, planning, seo, copywriting, prd, building)
* `chat_history` (conversation log)
* `project_meta` (structured: `{inferred: {field: {value, confidence, source, rationale}}, user_overrides: {field: value}}`)
* `seo_data`, `ux_strategy`, `copywriting` (specialist outputs)
* `agent_reasoning` (transparency: agent thoughts and certainty)
* `context_summary` (compressed project history)

**Skill** (backend/agents/registry.py):
* `id`, `name`, `description`
* `trigger_phrases` (for intent matching)
* `can_invoke_directly` (direct invocation support)
* `suggested_next` (linear flow suggestion)
* `requires_approval` (gate requirement)
* `auto_execute` (automatic execution flag)
* `prerequisites` (required skills)

---

## 5. Use Cases

### 5.1 Primary Workflow

**Linear Progression (PROCEED flow):**
1. **Intake** → User provides business info → Intake agent validates → Gate 1 (Intake & Audit)
2. **Research** → Auto-runs → Scrapes website URL or infers insights
3. **Strategy** → Auto-runs → Generates Project Brief (Markdown)
4. **UX** → Auto-runs → Creates user personas and conversion paths
5. **Planning** → Auto-runs → Generates sitemap → Gate 1 (Blueprint)
6. **SEO** → Auto-runs → Generates keywords and meta descriptions
7. **Copywriting** → Auto-runs → Generates marketing copy → Gate 2 (Marketing)
8. **PRD** → Auto-runs → Generates technical specification
9. **Building** → Auto-runs → Generates HTML/Tailwind code

**Intent-Driven Invocation:**
* User can trigger skills directly via natural language (e.g., "update the sitemap", "change the copy")
* Router analyzes intent and invokes matching skill
* Prerequisites are checked before execution

### 5.2 Key Use Cases

* **CreateWebsite**: User provides business info → System generates complete website
* **ReviseSitemap**: User provides feedback → Planner agent regenerates sitemap
* **UpdateCopy**: User requests copy changes → Copy agent regenerates content
* **ResearchBusiness**: User provides website URL → Research agent scrapes and analyzes
* **ExportWebsite**: (Not yet implemented) User downloads generated HTML/CSS

### 5.3 Business Rules

* Intake must complete (no missing_info) before proceeding to research
* Project Brief (strategy) must be approved before UX phase
* Sitemap (planning) requires approval (Gate 1: Blueprint)
* Marketing content (copywriting) requires approval (Gate 2: Marketing)
* Memory compression runs every 5 chat turns
* URL detection automatically triggers research agent
* CRM data fetching runs automatically if project_name matches known companies

---

## 6. Interfaces & Contracts

### 6.1 Backend API Endpoints

**REST API** (backend/main.py):
* `GET /` - Health check
* `GET /state` - Get current state for session
* `POST /session/new` - Create new session
* `GET /sessions` - List all sessions
* `DELETE /session/{session_id}` - Delete session
* `POST /update-project` - Update project fields (name, industry, brand_colors, design_style, project_meta, additional_context) with user override support
* `POST /fetch-external-data` - Fetch CRM data
* `POST /run-planner` - Manual planner trigger
* `POST /run-prd` - Manual PRD trigger
* `POST /chat` - Main streaming endpoint (SSE)
* `POST /enrich` - Enrich project metadata with inferred fields (scrape ~2s, LLM ~4s timeouts)

**Streaming Protocol** (POST /chat):
```
Request: { "message": "user text" }
Response: text/event-stream
  - Chunks: Chat response text
  - Marker: "|||STATE_UPDATE|||"
  - Final chunk: Complete WebsiteState JSON
```

**Update Project Protocol** (POST /update-project):
```
Request: {
  "project_name": "string",
  "industry": "string",
  "brand_colors": ["color1", "color2"],
  "design_style": "string",
  "project_meta": { "inferred": {...}, "user_overrides": {...} },
  "additional_context": { "key": "value" },
  "user_overrides": ["field1", "field2"]  // marks fields as user-provided
}
Response: { "message": "...", "state": WebsiteState }
Behavior:
  - project_meta and additional_context are merged (not replaced)
  - Fields in user_overrides array are written to project_meta.user_overrides
  - User overrides take precedence over inferred values
```

**Enrichment Protocol** (POST /enrich):
```
Request: {
  "url": "optional URL to scrape",
  "force": true  // re-run even if inferred fields exist (default: false)
}
Response: WebsiteState JSON with metadata:
  - _enrichment_completed: true/false
  - _enrichment_skipped: true (if skipped without force)
  - _force_used: true/false
  - _inferred_count: number of inferred fields
  - _user_overrides_count: number of user overrides

Timeouts: Scrape ~2s, LLM ~4s

Behavior:
  - Without force: Skips if project_meta.inferred already has fields
  - With force=true: Re-runs enrichment, merges with existing

Merge Rules (applied always, even with force):
  - Never overwrites project_meta.user_overrides
  - Only upgrades inferred values if confidence increases
  - Stores source + confidence per inferred field (e.g., "enrich_agent:web_scrape:forced")
```

### 6.2 Skill Registry Interface

**SkillRegistry** (backend/agents/registry.py):
* `get(skill_id)` - Retrieve skill by ID
* `get_by_step(step)` - Get skill for workflow step
* `find_skill_by_intent(user_message)` - Intent matching
* `get_next_in_flow(current_step)` - Linear progression
* `check_prerequisites(skill_id, state)` - Prerequisite validation
* `get_available_skills()` - Skills for prompt injection

### 6.3 State Synchronization Contract

**Marker Protocol:**
* Backend emits: `"\n\n|||STATE_UPDATE|||\n" + json.dumps(state_dict)`
* Frontend detects: `fullStreamContent.includes("|||STATE_UPDATE|||")`
* Frontend parses: `JSON.parse(parts[1].trim())`
* Frontend updates: `setState({ ...prev, ...newState })`

**Step Transition Rule:**
* `current_step` is **exclusively managed by the backend**
* Frontend MUST NOT mutate `current_step` directly
* Step transitions occur only via `|||STATE_UPDATE|||` state updates from backend
* Artifact detection (sitemap, PRD) triggers UI placeholders but does not change step

**Gate Action Protocol:**
* Backend emits: `"[GATE_ACTION: GATE_NAME]"`
* Frontend detects: `GATE_ACTION_PATTERN` regex
* Gate names: `INTAKE_&_AUDIT`, `BLUEPRINT`, `MARKETING`

---

## 7. Data & State

### 7.1 Persistence Strategy

* **Database**: SQLite (`clarity_sessions.db`)
* **ORM**: SQLAlchemy
* **Model**: `ProjectState` table
  * `session_id` (Primary Key, String)
  * `state_json` (JSON column, stores complete WebsiteState)
  * `created_at`, `updated_at` (timestamps)

* **Session Isolation**: Each user session gets unique `session_id` (UUID)
* **State Loading**: `get_state(session_id)` loads or creates default state
* **State Saving**: `save_state(session_id, state)` persists after each operation

### 7.2 State Transitions

**Workflow Steps** (backend/constants.py):
```
intake → research → strategy → ux → planning → seo → copywriting → prd → building
```

**Step Progression Logic:**
* Set by skill registry's `suggested_next` or `get_next_in_flow()`
* Advanced by `skill_executor.py` after skill completion
* Pauses at `requires_approval=True` skills (gates)

### 7.3 Important Invariants

* `crm_data` is always a dict (never None) for backward compatibility
* `current_step` must be a valid `StepName` enum value
* `chat_history` is always a list of `{role, content}` dicts
* State updates are atomic per session (SQLite transactions)
* Memory compression preserves essential context in `context_summary`

---

## 8. Error Handling Strategy

### 8.1 Error Types

* **Domain Errors**: Validation failures (e.g., missing required fields)
  * Handled by intake agent → `state.missing_info` list
  * User must provide missing information before proceeding

* **Application Errors**: Agent execution failures
  * Try/catch in agents → Fallback behavior (e.g., generic sitemap on planner error)
  * Errors logged to `state.logs` array
  * Streaming errors yield error strings to frontend

* **Infrastructure Errors**: Gemini API failures, database errors
  * API errors: Try/catch in `stream_gemini()` → Yields error string
  * Database errors: SQLAlchemy exceptions → HTTP 500 responses
  * No retry logic currently implemented

### 8.2 Error Recovery

* **Planner Agent**: Falls back to generic 4-page sitemap on error
* **Frontend**: Catches errors in `use-orchestrator.ts` → Logs to console (no UI error states)
* **Router Agent**: Catches exceptions → Yields error message → Continues execution

### 8.3 Error Reporting

* Backend logs to console with `[!]` prefix
* Errors appended to `state.logs` array
* Frontend errors logged to browser console
* No centralized error tracking or monitoring

---

## 9. Testing Strategy

### 9.1 Current Testing

* **No test files found** in codebase
* **No test infrastructure** (no pytest, jest, etc.)
* **Manual testing** via local development servers

### 9.2 What Should Be Tested (Future)

* **Unit Tests**: Domain logic (state transitions, skill prerequisites)
* **Integration Tests**: Agent execution, database persistence, API endpoints
* **E2E Tests**: Complete workflow from intake to website generation
* **What is intentionally NOT tested**: Gemini API responses (external dependency)

---

## 10. Key Decisions & Trade-offs

### 10.1 Architecture Decisions

* **Intent-Driven + Linear Flow**: Supports both direct skill invocation and linear progression
  * Trade-off: More complex router logic, but better user experience

* **Session-Based Persistence**: SQLite with session isolation
  * Trade-off: Simple setup, but not scalable for high concurrency

* **Streaming API (SSE)**: Real-time state updates via Server-Sent Events
  - Trade-off: Better UX, but more complex state synchronization

* **Skill Registry Pattern**: Central hub for all agent capabilities
  - Trade-off: Centralized but requires registry maintenance

* **Memory Compression**: Compress chat history every 5 turns
  - Trade-off: Reduces token usage, but may lose context details

### 10.2 Technology Choices

* **FastAPI**: Modern Python web framework with async support
* **SQLAlchemy**: ORM for database abstraction
* **Pydantic**: Type-safe data validation
* **Next.js**: React framework with SSR capabilities
* **Tailwind CSS**: Utility-first CSS framework
* **Google Gemini API**: AI model for agent reasoning and code generation

### 10.3 Current Limitations

* **In-Memory State (Legacy)**: Previously used global variable, now migrated to SQLite
* **No User Authentication**: Session-based only, no user accounts
* **Hardcoded URLs**: Frontend hardcodes `http://127.0.0.1:8000`
* **Mock CRM**: Only works for "Coffee Express" and "Fast Law"
* **No Export**: Generated code cannot be downloaded
* **No Rate Limiting**: Single user can exhaust API quota

---

## 11. Evolution Notes

### 11.1 Current Phase

* **Phase 2 Complete**: Session-based persistence, intent-driven architecture
* **Phase 3 In Progress**: Split-view UI (WorkspaceView component)

### 11.2 Potential Extensions

* **User Authentication**: Multi-user accounts with project ownership
* **Website Export**: Download HTML/CSS files
* **Revision History**: Track changes to sitemap, copy, etc.
* **Real CRM Integration**: Replace mock CRM with actual HubSpot/other APIs
* **Parallel Agent Execution**: Run SEO and Copy agents simultaneously
* **Advanced Mode**: Agent reasoning visualization (partially implemented)
* **Production Deployment**: Docker, environment-based config, scaling strategy

### 11.3 Current Limitations

* **Single-Process**: Cannot scale horizontally
* **SQLite**: Not suitable for production workloads
* **No Caching**: Every request hits database
* **No Rate Limiting**: API quota exhaustion risk
* **Hardcoded Configuration**: No environment-based settings

### 11.4 Known Risks

* **Token Usage**: Unbounded chat history can exhaust API quota
* **State Corruption**: Concurrent requests could corrupt state (mitigated by session isolation)
* **API Failures**: Single Gemini API failure breaks entire workflow (no retry logic)
* **Memory Growth**: Logs and chat history grow unbounded (compression helps but not perfect)

---

## 12. Instructions for LLMs (Critical)

> This section is **explicitly for AI systems**.

### 12.1 Codebase Navigation

* **DO NOT read the entire codebase** - Use this document as the single source of truth
* **Start with SYSTEM_ARTIFACT.md** before making any changes
* **Respect architectural boundaries**: Backend (Python/FastAPI) vs Frontend (TypeScript/Next.js)
* **Understand the Skill Registry** before modifying agent behavior
* **Check session isolation** - All state operations must use `session_id`

### 12.2 State Management Rules

* **WebsiteState is the single source of truth** - All agents modify this object
* **State updates must be saved** - Call `save_state(session_id, state)` after modifications
* **State synchronization** - Use `|||STATE_UPDATE|||` marker in streaming responses
* **Never modify state directly in frontend** - All updates come from backend via SSE
* **`current_step` is backend-only** - Frontend must never mutate `current_step`; it is set exclusively by backend via state updates

### 12.3 Agent Development Rules

* **Register skills in registry.py** - All new agents must be registered
* **Use trigger phrases** - Add phrases for intent-driven invocation
* **Respect prerequisites** - Check prerequisites before execution
* **Handle errors gracefully** - Fallback behavior for agent failures
* **Use prompts from prompts/** - Load prompts via `get_filled_prompt()`

### 12.4 Communication Protocol

* **Streaming responses** - Use `yield` in generator functions
* **State updates** - Emit `|||STATE_UPDATE|||` marker followed by JSON
* **Gate actions** - Emit `[GATE_ACTION: GATE_NAME]` for approval gates
* **Session headers** - Frontend sends `X-Session-ID` header

### 12.5 Common Pitfalls to Avoid

* **DO NOT** modify state without saving to database
* **DO NOT** hardcode session IDs or assume single user
* **DO NOT** bypass the Skill Registry for new agents
* **DO NOT** modify WebsiteState schema without updating both Python and TypeScript
* **DO NOT** forget to add trigger phrases for new skills
* **DO NOT** skip prerequisite checks
* **DO NOT** mutate `current_step` in frontend code - backend is the single source of truth for step transitions

### 12.6 When Making Changes

1. **Read SYSTEM_ARTIFACT.md first** - Understand the architecture
2. **Check session isolation** - Ensure changes work with multi-session support
3. **Update state schema** - If modifying WebsiteState, update both Python and TypeScript
4. **Test state synchronization** - Verify `|||STATE_UPDATE|||` markers work
5. **Register new skills** - Add to registry.py with proper configuration
6. **Update prompts** - If changing agent behavior, update prompt files
7. **Respect gates** - Maintain two-gate approval workflow

---

## 13. Last Updated

* **Date**: 2026-01-25
* **Author**: System Artifact Update
* **Change Context**: Added guided intake components in `frontend/src/components/intake/`: GuidedIntakeView (main container with data priority: user_overrides > inferred > empty), ChipPicker (industry selection), ColorPicker (brand colors with presets), FontPicker (typography), StyleCard (design styles); all pickers call updateProject() on change and display AI badge for inferred values
* **Version**: 1.7.0
