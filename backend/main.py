# backend/main.py
"""
FastAPI backend with session-based persistence and multi-tenancy support.
Each user session gets its own isolated WebsiteState stored in SQLite.
"""

import json

from fastapi import FastAPI, Body, Header, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional

from state_schema import WebsiteState
from database import get_state, save_state, generate_session_id, delete_session, list_sessions
from agents.intake_agent import run_intake_agent
from agents.planner_agent import run_planner_agent
from agents.prd_agent import run_prd_agent
from agents.router_agent import run_router_agent
from services.mock_crm import mock_hubspot_fetcher
from services.enrich_service import run_enrichment

app = FastAPI(title="Clarity by Plinng", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"],  # Expose session ID header to frontend
)


def get_session_id(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
) -> str:
    """
    Extract session_id from either header or query parameter.
    Generates a new session ID if none provided.
    """
    sid = x_session_id or session_id
    if not sid:
        sid = generate_session_id()
        print(f"[Session] Generated new session: {sid}")
    return sid


@app.get("/")
def home():
    return {"status": "Backend is online", "version": "1.5.0 - Safe enrichment reruns"}


@app.post("/session/new")
def create_new_session():
    """
    Create a new session and return the session_id.
    Useful for explicitly starting a fresh project.
    """
    session_id = generate_session_id()
    # Initialize the state in DB
    _ = get_state(session_id)
    return {"session_id": session_id, "message": "New session created"}


@app.get("/sessions")
def get_all_sessions():
    """
    List all active sessions (admin/debug endpoint).
    """
    sessions = list_sessions()
    return {"sessions": sessions, "count": len(sessions)}


@app.delete("/session/{session_id}")
def remove_session(session_id: str):
    """
    Delete a specific session.
    """
    deleted = delete_session(session_id)
    if deleted:
        return {"message": f"Session {session_id} deleted"}
    raise HTTPException(status_code=404, detail="Session not found")


@app.get("/state")
def get_project_state(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Get the current state for a session.
    Creates a new default state if session doesn't exist.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)
    # Return state with session_id in response for client reference
    response = state.model_dump()
    response["_session_id"] = sid
    return response


@app.post("/update-project")
def update_project(
    data: dict = Body(...),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Update project with form data and run intake audit.

    PR-03: Tracks user overrides in state.project_meta["user_overrides"].
    PR-04: Accepts structured fields (brand_colors, design_style, project_meta,
           additional_context) with proper merge logic.

    Supported fields:
    - project_name (str): Project/business name
    - industry (str): Business industry
    - design_style (str): Visual design style preference
    - brand_colors (list[str]): Brand color hex values
    - project_meta (dict): Merged with existing; nested "inferred" and
      "user_overrides" dicts are also merged (not replaced)
    - additional_context (dict): Merged with existing (shallow merge)

    Top-level field updates are automatically recorded as user_overrides.
    User overrides from project_meta are applied to active WebsiteState fields.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Ensure defaults exist (defensive, PR-02/PR-04)
    # ─────────────────────────────────────────────────────────────────────────
    if not isinstance(state.project_meta, dict):
        state.project_meta = {}
    if "inferred" not in state.project_meta:
        state.project_meta["inferred"] = {}
    if "user_overrides" not in state.project_meta:
        state.project_meta["user_overrides"] = {}

    if not isinstance(state.additional_context, dict):
        state.additional_context = {}

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Update active fields from top-level payload (PR-03/PR-04)
    #    Also record as user_overrides so /enrich won't overwrite them
    # ─────────────────────────────────────────────────────────────────────────
    if "project_name" in data:
        state.project_name = data["project_name"]
        state.project_meta["user_overrides"]["project_name"] = data["project_name"]

    if "industry" in data:
        state.industry = data["industry"]
        state.project_meta["user_overrides"]["industry"] = data["industry"]

    if "design_style" in data:
        state.design_style = data["design_style"]
        state.project_meta["user_overrides"]["design_style"] = data["design_style"]

    if "brand_colors" in data:
        state.brand_colors = data["brand_colors"]
        state.project_meta["user_overrides"]["brand_colors"] = data["brand_colors"]

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Merge project_meta with nested handling (PR-04)
    #    - Shallow merge at top level
    #    - Deep merge for "inferred" and "user_overrides" nested dicts
    # ─────────────────────────────────────────────────────────────────────────
    if "project_meta" in data and isinstance(data["project_meta"], dict):
        incoming_meta = data["project_meta"]
        for key, value in incoming_meta.items():
            if key == "user_overrides" and isinstance(value, dict):
                # Merge nested user_overrides (don't replace)
                state.project_meta["user_overrides"].update(value)
            elif key == "inferred" and isinstance(value, dict):
                # Merge nested inferred (don't replace)
                state.project_meta["inferred"].update(value)
            else:
                # Shallow merge for other keys
                state.project_meta[key] = value

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Merge additional_context (PR-04)
    #    Shallow merge: incoming keys are added/updated, existing keys preserved
    # ─────────────────────────────────────────────────────────────────────────
    if "additional_context" in data and isinstance(data["additional_context"], dict):
        state.additional_context.update(data["additional_context"])

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Apply user overrides to active fields (PR-04)
    #    If project_meta.user_overrides contains field values, apply them to
    #    the corresponding active WebsiteState fields. This ensures overrides
    #    sent via project_meta take effect immediately.
    # ─────────────────────────────────────────────────────────────────────────
    overrides = state.project_meta.get("user_overrides", {})

    if "industry" in overrides and overrides["industry"]:
        state.industry = overrides["industry"]

    if "design_style" in overrides and overrides["design_style"]:
        state.design_style = overrides["design_style"]

    if "brand_colors" in overrides and overrides["brand_colors"]:
        state.brand_colors = overrides["brand_colors"]

    # Handle common alias keys defensively (future-proofing)
    if "colors" in overrides and overrides["colors"] and "brand_colors" not in overrides:
        state.brand_colors = overrides["colors"]
        # Normalize to canonical key
        state.project_meta["user_overrides"]["brand_colors"] = overrides["colors"]

    if "style" in overrides and overrides["style"] and "design_style" not in overrides:
        state.design_style = overrides["style"]
        # Normalize to canonical key
        state.project_meta["user_overrides"]["design_style"] = overrides["style"]

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Run Intake Agent audit (existing behavior)
    # ─────────────────────────────────────────────────────────────────────────
    state = run_intake_agent(state)

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Save state and return
    # ─────────────────────────────────────────────────────────────────────────
    save_state(sid, state)

    response = state.model_dump()
    response["_session_id"] = sid
    return {"message": "State updated and Agent ran", "state": response}


@app.post("/fetch-external-data")
def fetch_external_data(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Fetch external CRM data for the project.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    company_name = state.project_name

    if company_name:
        found_data = mock_hubspot_fetcher(company_name)
        if found_data:
            state.crm_data = found_data
            state.logs.append(f"CRM Fetcher: Found info for {company_name}")
            # Run the agent to update the missing_info list
            state = run_intake_agent(state)

    # Save updated state to DB
    save_state(sid, state)

    response = state.model_dump()
    response["_session_id"] = sid
    return response


@app.post("/run-planner")
def run_planner(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Run the planner agent to generate sitemap.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    # Logic: Only run the planner if the Intake is finished
    if state.current_step != "planning":
        return {"error": "Finish the Intake process first!"}

    # Run the Agent
    state = run_planner_agent(state)

    # Save updated state to DB
    save_state(sid, state)

    response = state.model_dump()
    response["_session_id"] = sid
    return response


@app.post("/run-prd")
def run_prd(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Run the PRD agent to generate technical spec.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    if not state.sitemap:
        return {"error": "Need a sitemap first!"}

    state = run_prd_agent(state)

    # Save updated state to DB
    save_state(sid, state)

    response = state.model_dump()
    response["_session_id"] = sid
    return response


@app.post("/enrich")
def enrich(
    data: dict = Body(...),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    PR-03: Runs scraper + LLM enrichment based on seed_text and optional website_url.

    Infers business attributes (industry, design_style, brand_colors, etc.) and stores
    them in state.project_meta["inferred"]. Active fields are updated ONLY if not
    already overridden by the user (via state.project_meta["user_overrides"]).

    Request body:
        - seed_text (required): User's initial input describing their business
        - website_url (optional): Website URL to scrape for additional context
        - force (optional, default False): Re-run enrichment even if already done

    Returns:
        - message: Status message
        - state: Updated WebsiteState with inferred values
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    # Extract request parameters
    seed_text = data.get("seed_text", "")
    website_url = data.get("website_url")
    force = data.get("force", False)

    if not seed_text:
        response = state.model_dump()
        response["_session_id"] = sid
        return {"message": "No seed_text provided", "state": response}

    # Run enrichment (never throws, always returns state)
    state = run_enrichment(state, seed_text, website_url, force)

    # Save updated state to DB
    save_state(sid, state)

    response = state.model_dump()
    response["_session_id"] = sid
    return {"message": "Enrichment complete", "state": response}


@app.post("/chat")
async def chat(
    message_data: dict = Body(...),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Handle chat messages with the router agent.
    Streams responses back to the client.
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    user_text = message_data.get("message", "")

    if not user_text:
        response = state.model_dump()
        response["_session_id"] = sid
        return response

    # Add user message to history
    state.chat_history.append({"role": "user", "content": user_text})

    # Create a generator wrapper that saves state after completion
    def streaming_with_save():
        nonlocal state
        final_state_json = None

        for chunk in run_router_agent(state, user_text):
            # Check for state update marker
            from constants import STATE_UPDATE_MARKER
            if STATE_UPDATE_MARKER in chunk:
                # The next chunk will be the state JSON
                yield chunk
            elif chunk.startswith("{") and '"project_name"' in chunk:
                # This is the state JSON - parse it to update our state reference
                try:
                    import json
                    state_dict = json.loads(chunk)
                    # Remove internal fields before creating WebsiteState
                    state_dict.pop("_session_id", None)
                    # Ensure crm_data is always a dict, never None
                    if state_dict.get("crm_data") is None:
                        state_dict["crm_data"] = {}
                    state = WebsiteState(**state_dict)
                except Exception as e:
                    print(f"[!] Failed to parse state update: {e}")
                yield chunk
            else:
                yield chunk

        # Save the final state to DB after streaming completes
        save_state(sid, state)
        print(f"[Chat] Saved state for session: {sid}")

    return StreamingResponse(
        streaming_with_save(),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "X-Session-ID": sid,  # Return session ID in response header
        }
    )
