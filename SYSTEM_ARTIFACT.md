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
│   │   └── enrich_agent.txt    # PR-03: LLM inference prompt for /enrich
│   ├── services/               # PR-03: Business logic services
│   │   ├── __init__.py         # Package exports
│   │   ├── mock_crm.py         # Mock CRM integrations (moved from services.py)
│   │   ├── scraper_service.py  # PR-03: Lightweight website scraper
│   │   ├── enrich_service.py   # PR-03: Enrichment orchestration (enhanced with mapping/visuals)
│   │   ├── field_mapper.py     # AI-powered field value mapping to predefined options
│   │   └── visual_generator.py # AI-powered visual generation for unmatched values
│   ├── main.py                 # FastAPI server entry point
│   ├── state_schema.py         # WebsiteState Pydantic model (PR-02: InferredField)
│   ├── database.py             # SQLAlchemy session persistence
│   ├── constants.py            # Step names, markers, gate names
│   └── utils.py                # Gemini API helpers
│
└── frontend/                   # Next.js React application
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # Main application (HeroSection → BootstrappingScreen → FlowShell, PR-07.1)
    │   │   ├── layout.tsx      # Root layout
    │   │   └── globals.css     # Tailwind CSS styles + PR-07.1 global button/badge classes
    │   ├── components/magic/   # Specialized UI components
    │   │   ├── HeroSection.tsx      # Initial input form
    │   │   ├── FlowShell.tsx        # PR-06/07: Linear full-screen UX container
    │   │   ├── WorkspaceView.tsx    # Legacy split-view layout (kept for fallback)
    │   │   ├── ChatInterface.tsx    # Chat loop
    │   │   ├── ArtifactWorkspace.tsx # Artifact tabs (Sitemap, PRD, Marketing)
    │   │   ├── BuilderSection.tsx   # Website preview (iframe)
    │   │   └── AgentTrace.tsx       # Agent reasoning visualization
    │   ├── components/intake/  # Intake components
    │   │   ├── MagicalIntakeView.tsx     # Single-screen magical intake (all fields at once)
    │   │   ├── GuidedIntakeView.tsx      # Legacy step-by-step wizard (kept for fallback)
    │   │   ├── intakeQuestions.ts        # Question definitions and field helpers
    │   │   ├── components/
    │   │   │   ├── cards/                # Field-specific card components
    │   │   │   │   ├── BusinessNameCard.tsx
    │   │   │   │   ├── IndustryCard.tsx
    │   │   │   │   ├── GoalCard.tsx
    │   │   │   │   ├── StyleCard.tsx
    │   │   │   │   ├── ToneCard.tsx
    │   │   │   │   ├── ColorsCard.tsx
    │   │   │   │   ├── FontsCard.tsx
    │   │   │   │   └── PagesCard.tsx
    │   │   │   ├── SourceBadge.tsx       # Data source indicator badge
    │   │   │   ├── FieldCard.tsx         # Base card wrapper component
    │   │   │   ├── visualHelpers.ts      # Visual retrieval utilities for unmatched values
    │   │   │   └── pickers/              # UI pickers (SingleSelectChips, ColorPicker, etc.)
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
* **frontend/src/hooks/**: State management and API communication

**FlowShell Routing:**

The app uses a linear full-screen UX flow post-hero:
1. `page.tsx` checks `USE_FLOW_SHELL` flag (default: true)
2. After hero submission:
   - Shows `BootstrappingScreen` ("Setting things up…") immediately
   - Calls `/enrich` endpoint via `enrichProject()` to populate inferred values
   - Calls `refreshState()` to sync enriched data to React state
   - Then sends chat message via `sendMessage()`
   - State readiness check: requires actual data (not empty objects) - `Object.keys().length > 0` for `inferred` and `additional_context`
   - Transitions to FlowShell only when `isStateReady && !loading`
3. FlowShell routing:
   - If `state.generated_code` exists → Full-screen website preview (iframe)
   - Else → MagicalIntakeView (single-screen magical intake with all fields)

**Magical Intake (Current):**

MagicalIntakeView displays all business information at once in a structured 2-column premium card layout with intelligent field mapping and dynamic visual generation:
- **Layout**: Two-column grid (1 column mobile → 2 columns desktop)
  - Left column: Brand Colors, Typography, Style (Brand Identity section)
  - Right column: Industry, Goal, Brand Tone, Pages (Business Details section)
  - Business Name: Full-width header card at top with logo placeholder
  - Spacing: gap-6 on mobile, gap-8 on desktop with consistent vertical rhythm
- **Premium Background**: White background with subtle dot texture pattern and gradient overlays
- **8 Field Cards**: Business Name, Industry, Goal, Style, Tone, Colors, Fonts, Pages
  - Each card features contextual icon, premium styling with enhanced shadows and hover effects
  - Visual displays: 
    - Business Name: Full-width header with logo placeholder (80x80px)
    - Colors: Grid of swatches with names/hex codes
    - Typography: Display Font and Body Font sections with actual font rendering
    - Style: Visual style preview thumbnail
    - Tone: Icon-based indicators with characteristics chips
    - Industry: Icon-based indicators with characteristics chips (matches ToneCard style)
    - Goal: Icon-based indicators with characteristics chips (matches ToneCard style)
    - Pages: Multi-select chips display
- **Source Tracking**: Each card shows data source badge (user/CRM/scraped/inferred)
- **Inline Editing**: Click edit icon on any card to modify field inline
- **Field Value Priority**: `user_overrides` > `inferred` > top-level state > empty
- **Persistence**: Calls `/update-project` with field value and `project_meta.user_overrides`
- **Smart Field Mapping**: AI-powered mapping of inferred/scraped values to predefined options when confidence is high (>0.7)
- **Dynamic Visual Generation**: AI-generated visuals (icon, color, characteristics) for unmatched values that don't fit predefined options
- **Unmatched Value Display**: All inferred/scraped/user values are visible in UI, even if they don't match predefined options, with generated visuals
- **Special Pickers**: 
  - Colors: Inline color palette selector (display shows grid of swatches with names/hex codes)
  - Fonts: Inline font preview grid (display shows Display Font and Body Font sections with actual font rendering)
  - Style: Inline visual style chooser (display shows style preview thumbnail)
  - Tone: Visual tone selector with icons and characteristics (display shows icon and colored badges)
  - Industry: Visual selector with icons and characteristics (display shows icon and colored badges)
  - Goal: Visual selector with icons and characteristics (display shows icon and colored badges)
  - Others: Standard chips/text inputs
- **Validation**: "Create Website" button only enables when required fields filled (project_name, industry, design_style, brand_colors)
- **Source Detection**: Uses `getFieldSource()` utility to determine data origin (user input, CRM, scraped, or AI inference)

**Guided Intake (Legacy - Kept for Fallback):**

GuidedIntakeView (step-by-step wizard) is still available but replaced by MagicalIntakeView:
- Displays one question at a time with progress bar
- Used as fallback or for debugging
- Same field priority and persistence logic as MagicalIntakeView

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
* `project_meta` (PR-02: structured metadata - see below), `seo_data`, `ux_strategy`, `copywriting` (specialist outputs)
* `agent_reasoning` (transparency: agent thoughts and certainty)
* `context_summary` (compressed project history)

**InferredField** (backend/state_schema.py, PR-02):
* `value` (Any - the inferred value)
* `confidence` (float 0.0-1.0 - confidence score)
* `source` (string - "llm", "scraped", "hybrid", "default")
* `rationale` (string - short explanation of inference)

**project_meta Structure** (PR-02, Enhanced):
* `project_meta["inferred"]`: Dict of field_name → InferredField-like objects (machine-suggested values)
  * Structure: `{value, confidence, source, rationale}` where source is "llm", "scraped", "hybrid", or "default"
* `project_meta["user_overrides"]`: Dict of field_name → user-provided values (always takes precedence)
* `project_meta["field_mappings"]`: Dict of field_name → mapping metadata (new)
  * Structure: `{original_value, mapped_value, confidence, rationale}` - stores AI mapping results when inferred values are mapped to predefined options
* `project_meta["field_visuals"]`: Dict of field_name → visual metadata (new)
  * Structure: `{icon, color, characteristics}` - stores AI-generated visuals for unmatched values
* Used by both MagicalIntakeView and GuidedIntakeView for field value resolution

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

* **CreateWebsite**: User provides business info (via magical intake screen) → System generates complete website
  * User sees all fields at once in card layout
  * AI auto-fills fields from user input, scraped data, CRM, or LLM inference
  * User can edit any field inline
  * "Create Website" button triggers full build pipeline
* **ReviseSitemap**: User provides feedback → Planner agent regenerates sitemap
* **UpdateCopy**: User requests copy changes → Copy agent regenerates content
* **ResearchBusiness**: User provides website URL → Research agent scrapes and analyzes
* **ExportWebsite**: (Not yet implemented) User downloads generated HTML/CSS

### 5.3 Business Rules

* Intake must complete (no missing_info) before proceeding to research
* Project Brief (strategy) must be approved before UX phase
* Sitemap (planning) no longer requires approval gate - user approval happens at magical intake completion ("Create Website" button)
* Marketing content (copywriting) requires approval (Gate 2: Marketing) - currently disabled in new flow
* Memory compression runs every 5 chat turns
* URL detection automatically triggers research agent
* CRM data fetching runs automatically if project_name matches known companies
* After "Create Website" click, build chain runs uninterrupted: research → strategy → ux → planning → seo → copywriting → prd → building
* Field source tracking: System tracks whether each field came from user input, CRM, scraped data, or AI inference

---

## 6. Interfaces & Contracts

### 6.1 Backend API Endpoints

**REST API** (backend/main.py):
* `GET /` - Health check
* `GET /state` - Get current state for session
* `POST /session/new` - Create new session
* `GET /sessions` - List all sessions
* `DELETE /session/{session_id}` - Delete session
* `POST /update-project` - Update project and run intake (PR-03: tracks user_overrides, PR-04: accepts structured fields with merge logic)
* `POST /fetch-external-data` - Fetch CRM data
* `POST /run-planner` - Manual planner trigger
* `POST /run-prd` - Manual PRD trigger
* `POST /enrich` - PR-03: Scraper + LLM inference endpoint (see below)
* `POST /chat` - Main streaming endpoint (SSE)

**POST /update-project** (PR-04 expanded):
```
Request: {
  "project_name": "...",           // optional
  "industry": "...",               // optional
  "design_style": "...",           // optional
  "brand_colors": ["#...", ...],   // optional
  "project_meta": { ... },         // optional, merged (nested inferred/user_overrides also merged)
  "additional_context": { ... }    // optional, merged (shallow)
}
Response: { "message": "...", "state": WebsiteState }
```
* Accepts structured fields beyond project_name/industry
* Top-level field updates are automatically recorded as user_overrides
* `project_meta` merge: shallow merge at top level, deep merge for `inferred` and `user_overrides` nested dicts
* `additional_context` merge: shallow merge (incoming keys added/updated, existing preserved)
* User overrides from `project_meta.user_overrides` are applied to active WebsiteState fields
* Alias keys supported: `colors` → `brand_colors`, `style` → `design_style`
* Runs Intake Agent audit after updates
* Backward compatible: existing clients sending only project_name/industry still work

**POST /enrich** (PR-03, PR-05 enhanced):
```
Request: { "seed_text": "...", "website_url": "..." (optional), "force": false }
Response: { "message": "Enrichment complete", "state": WebsiteState }
```
* Runs lightweight scraper (2s timeout) if website_url provided
* Runs LLM inference via prompts/enrich_agent.txt
* Stores inferred values in `state.project_meta["inferred"]`
* Updates active fields (industry, design_style, brand_colors) ONLY if not user-overridden
* Never throws; always returns valid state with logs
* **PR-05 Safe Rerun Rules:**
  - Skip if `force=false`, inferred non-empty, and no `website_url` provided
  - Confidence upgrade: only replace inferred[field] if `new_confidence > old_confidence`
  - User overrides in `project_meta["user_overrides"]` are NEVER modified
  - Active fields update only when NOT overridden AND inference was accepted (new or upgraded)
  - Logs include: run mode (initial/forced/rerun), accepted/upgraded/kept counts

**Streaming Protocol** (POST /chat):
```
Request: { "message": "user text" }
Response: text/event-stream
  - Chunks: Chat response text
  - Marker: "|||STATE_UPDATE|||"
  - Final chunk: Complete WebsiteState JSON
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
* `project_meta` always contains `inferred` and `user_overrides` keys (PR-02)

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
* **Phase 3 Complete**: Magical single-screen intake (MagicalIntakeView)
  * Replaced step-by-step wizard with single-screen card layout
  * All fields visible at once with source tracking
  * Inline editing for all fields
  * Auto-population from user input, LLM, scraped data, and CRM

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
* **Backend is sole authority for `current_step`** (PR-01) - Frontend must NEVER mutate `current_step` based on client-side heuristics (e.g., artifact detection). Visual placeholders like `[GENERATING_SITEMAP]` are allowed for UX, but step transitions are driven exclusively by backend state updates.

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
* **DO NOT** mutate `current_step` in frontend based on artifact detection or streaming markers (PR-01)

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

* **Date**: 2026-01-26
* **Author**: Smart Field Mapping and Dynamic Visual Generation
* **Change Context**: Enhanced intake system with AI-powered field mapping and visual generation for unmatched values
  - **Backend Enhancements**:
    - Created `field_mapper.py` service for AI-powered mapping of inferred values to predefined options
    - Created `visual_generator.py` service for AI-powered generation of card visuals (icon, color, characteristics)
    - Enhanced `enrich_service.py` to use mapping and visual generation during enrichment
    - Enhanced `research_agent.py` to map and generate visuals for research data
    - Updated `state_schema.py` to include `field_mappings` and `field_visuals` in project_meta
  - **Frontend Enhancements**:
    - Created `visualHelpers.ts` with utilities for retrieving and rendering field visuals
    - Enhanced `intakeQuestions.ts` with `getFieldVisuals()` and improved `buildPriorityOptions()` to handle mappings
    - Updated all card components (IndustryCard, ToneCard, StyleCard, GoalCard, FontsCard) to display unmatched values with generated visuals
    - Cards now show all inferred/scraped/user values, even if they don't match predefined options
  - **Key Features**:
    - Hybrid mapping strategy: AI maps values to predefined options when confidence is high (>0.7), otherwise generates custom visuals
    - All values are visible: No more "selected but not shown" - every inferred value gets a visual representation
    - Intelligent fallbacks: Generic visuals used if AI generation fails
    - Backward compatible: Existing state and functionality preserved
  - **Files Modified**:
    - `backend/services/field_mapper.py` (new)
    - `backend/services/visual_generator.py` (new)
    - `backend/services/enrich_service.py`
    - `backend/agents/research_agent.py`
    - `backend/state_schema.py`
    - `frontend/src/components/intake/components/visualHelpers.ts` (new)
    - `frontend/src/components/intake/intakeQuestions.ts`
    - `frontend/src/components/intake/components/cards/IndustryCard.tsx`
    - `frontend/src/components/intake/components/cards/ToneCard.tsx`
    - `frontend/src/components/intake/components/cards/StyleCard.tsx`
    - `frontend/src/components/intake/components/cards/GoalCard.tsx`
    - `frontend/src/components/intake/components/cards/FontsCard.tsx`
  - **Previous**: Two-Column Layout Refinement (2026-01-26)
* **Version**: 2.3.0

---

* **Date**: 2026-01-26
* **Author**: Two-Column Layout Refinement
* **Change Context**: Refined MagicalIntakeView from masonry to structured 2-column layout with enhanced visual displays
  - **Layout Restructure**:
    - Replaced masonry grid with clean 2-column layout
    - Left column: Brand Colors, Typography, Style (Brand Identity)
    - Right column: Industry, Goal, Brand Tone, Pages (Business Details)
    - Business Name card: Full-width header at top with logo placeholder
    - Improved spacing: gap-6 on mobile, gap-8 on desktop
    - Better vertical rhythm with consistent card spacing (space-y-6 on mobile, space-y-8 on desktop)
  - **Business Name Card Enhancement**:
    - Full-width header card with prominent business name display
    - Logo placeholder area (80x80px) with dashed border and icon hint
    - Enhanced layout: Logo | Business Name | Edit controls
    - Larger typography (text-2xl sm:text-3xl) for business name
    - Space reserved for future tagline/description field
  - **Industry Card Enhancement**:
    - Applied ToneCard-style visual pattern
    - Large icon (48px) with colored background container
    - Industry name prominently displayed with description
    - Characteristics chips for each industry (e.g., Technology: "Innovation", "Digital", "Cutting-edge")
    - Industry visual mapping with appropriate icons and colors for all 11 industries
  - **Goal Card Enhancement**:
    - Applied ToneCard-style visual pattern
    - Large icon (48px) with colored background container
    - Goal name prominently displayed with description
    - Characteristics chips for each goal (e.g., Lead Generation: "Capture", "Convert", "Engage")
    - Goal visual mapping with appropriate icons and colors for all 6 goals
  - **Visual Improvements**:
    - Enhanced card hover effects with smoother transitions (cubic-bezier easing)
    - Improved shadow depth on hover (translateY(-2px))
    - Better border color transitions on hover
    - Increased padding in main container (p-8 on desktop)
    - Consistent spacing throughout layout
  - **Files Modified**:
    - `frontend/src/components/intake/MagicalIntakeView.tsx` - Layout restructure to 2 columns
    - `frontend/src/components/intake/components/cards/BusinessNameCard.tsx` - Full-width header with logo placeholder
    - `frontend/src/components/intake/components/cards/IndustryCard.tsx` - ToneCard-style visual display
    - `frontend/src/components/intake/components/cards/GoalCard.tsx` - ToneCard-style visual display
    - `frontend/src/app/globals.css` - Enhanced card hover effects
  - **Previous**: Premium Cards UI Enhancement (2026-01-26)
* **Version**: 2.2.0

---

* **Date**: 2026-01-26
* **Author**: Premium Cards UI Enhancement
* **Change Context**: Transformed MagicalIntakeView cards screen into premium, visually-rich experience
  - **UI Enhancements**:
    - **Background & Styling**: Updated to white background with subtle dot texture pattern and gradient overlays
      - Added `.bg-premium` class with radial gradient dot pattern and subtle color gradients
      - Updated card backgrounds to pure white with enhanced shadows and hover effects
      - Premium card styling with improved borders, shadows, and transitions
    - **FieldCard Component**: Enhanced base card wrapper with icon support and premium styling
      - Added icon prop support with colored icon containers (8x8 rounded squares)
      - Enhanced shadows, borders, and hover effects for premium feel
      - Updated to use white card backgrounds matching new theme
    - **Color Card**: Transformed to visual grid display
      - Grid layout with color swatches (48px rounded squares)
      - Each color shows: swatch, color name, and hex code
      - Added Brain icon with light blue color (#60A5FA)
    - **Typography Card**: Enhanced with actual font previews
      - "Display Font" section: Shows font name in large, styled text using actual display font (italic for serif)
      - "Body Font" section: Shows font name in smaller text using actual body font
      - Added Type icon with green color (#22C55E)
    - **Style Card**: Added visual style preview display
      - Shows StylePreview thumbnail when not editing
      - Displays style name and description prominently
      - Added Palette icon with purple color (#A855F7)
    - **Tone Card**: Enhanced with visual indicators
      - Icon-based visual representation for each tone (Briefcase, Smile, Coffee, Award, Sparkles, Zap)
      - Shows tone characteristics as colored badges
      - Added MessageCircle icon with purple color (#A855F7)
    - **All Card Icons**: Added contextual icons to all cards
      - BusinessNameCard: Building2 icon (indigo #6366F1)
      - IndustryCard: Briefcase icon (blue #3B82F6)
      - GoalCard: Target icon (red #EF4444)
      - PagesCard: FileText icon (green #10B981)
    - **Layout Optimization**: Improved masonry grid layout
      - Updated MagicalIntakeView to use premium background with texture
      - Optimized grid with `grid-auto-flow: dense` for better space utilization
      - Adjusted column spans to minimize empty spaces (FontsCard spans 2 columns on xl screens)
      - Header and footer with backdrop blur for premium feel
  - **Files Modified**:
    - `frontend/src/app/globals.css` - Background textures, premium card styles
    - `frontend/src/components/intake/MagicalIntakeView.tsx` - Layout, background, grid optimization
    - `frontend/src/components/intake/components/FieldCard.tsx` - Icon support, premium styling
    - `frontend/src/components/intake/components/cards/ColorsCard.tsx` - Grid display format
    - `frontend/src/components/intake/components/cards/FontsCard.tsx` - Font preview display
    - `frontend/src/components/intake/components/cards/StyleCard.tsx` - Visual style preview
    - `frontend/src/components/intake/components/cards/ToneCard.tsx` - Visual tone indicators
    - `frontend/src/components/intake/components/cards/BusinessNameCard.tsx` - Added icon
    - `frontend/src/components/intake/components/cards/IndustryCard.tsx` - Added icon
    - `frontend/src/components/intake/components/cards/GoalCard.tsx` - Added icon
    - `frontend/src/components/intake/components/cards/PagesCard.tsx` - Added icon
  - **Previous**: Magical Single-Screen Intake Implementation (2026-01-26)
* **Version**: 2.1.0
