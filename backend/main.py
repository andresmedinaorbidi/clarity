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
from services import mock_hubspot_fetcher

app = FastAPI(title="Clarity by Plinng", version="1.1.0")

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
    return {"status": "Backend is online", "version": "1.1.0 - Session-based persistence"}


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
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    # Update the state with what the user sent
    if "project_name" in data:
        state.project_name = data["project_name"]
    if "industry" in data:
        state.industry = data["industry"]

    # Run the Intake Agent to check the work
    state = run_intake_agent(state)

    # Save updated state to DB
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
            if "|||STATE_UPDATE|||" in chunk:
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
