# backend/main.py
"""
FastAPI backend with session-based persistence and multi-tenancy support.
Each user session gets its own isolated WebsiteState stored in SQLite.
"""

import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Body, Header, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional

from state_schema import WebsiteState, InferredField, ProjectMeta
from database import get_state, save_state, generate_session_id, delete_session, list_sessions
from utils_scraper import scrape_url, extract_url_from_text
from utils import ask_gemini
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

    Supports updating:
    - project_name (string)
    - industry (string)
    - brand_colors (list)
    - design_style (string)
    - project_meta (merge dict into existing)
    - additional_context (merge dict into existing)

    User overrides:
    - Pass "user_overrides": ["field1", "field2"] to mark fields as user-provided
    - These values are stored in project_meta.user_overrides and take precedence over inferred values
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    # Fields that can be marked as user overrides
    override_fields = data.get("user_overrides", [])

    # Update the state with what the user sent
    if "project_name" in data:
        state.project_name = data["project_name"]
        if "project_name" in override_fields:
            state.project_meta.user_overrides["project_name"] = data["project_name"]

    if "industry" in data:
        state.industry = data["industry"]
        if "industry" in override_fields:
            state.project_meta.user_overrides["industry"] = data["industry"]

    if "brand_colors" in data:
        colors = data["brand_colors"]
        if isinstance(colors, list):
            state.brand_colors = colors
            if "brand_colors" in override_fields:
                state.project_meta.user_overrides["brand_colors"] = colors

    if "design_style" in data:
        state.design_style = data["design_style"]
        if "design_style" in override_fields:
            state.project_meta.user_overrides["design_style"] = data["design_style"]

    if "project_meta" in data:
        meta_update = data["project_meta"]
        if isinstance(meta_update, dict):
            # Merge inferred fields if provided
            if "inferred" in meta_update and isinstance(meta_update["inferred"], dict):
                for key, val in meta_update["inferred"].items():
                    if isinstance(val, dict) and "value" in val:
                        state.project_meta.inferred[key] = InferredField(
                            value=val.get("value"),
                            confidence=float(val.get("confidence", 0.5)),
                            source=val.get("source", "user_update"),
                            rationale=val.get("rationale", "")
                        )
            # Merge user_overrides if provided
            if "user_overrides" in meta_update and isinstance(meta_update["user_overrides"], dict):
                state.project_meta.user_overrides.update(meta_update["user_overrides"])

    if "additional_context" in data:
        context_update = data["additional_context"]
        if isinstance(context_update, dict):
            state.additional_context.update(context_update)

    # Log the update
    updated_fields = [k for k in ["project_name", "industry", "brand_colors", "design_style", "project_meta", "additional_context"] if k in data]
    if updated_fields:
        state.logs.append(f"Project updated: {', '.join(updated_fields)}")
    if override_fields:
        state.logs.append(f"User overrides set: {', '.join(override_fields)}")

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


# Thread pool for running blocking operations with timeouts
_executor = ThreadPoolExecutor(max_workers=4)


def _run_scrape_with_timeout(url: str, timeout: float = 2.0) -> dict:
    """Run scraping with a timeout."""
    return scrape_url(url, timeout=timeout)


def _run_llm_enrichment(project_name: str, industry: str, scraped_content: str = "") -> dict:
    """
    Run LLM enrichment to infer business fields.
    Returns dict of field_name -> {value, confidence, rationale}
    """
    context = f"Business: {project_name}"
    if industry:
        context += f", Industry: {industry}"
    if scraped_content:
        context += f"\n\nWebsite content:\n{scraped_content[:3000]}"

    prompt = f"""You are a Business Intelligence Analyst. Analyze the following business information and infer key attributes.

{context}

Return ONLY a valid JSON object with inferred fields. Each field should have:
- value: the inferred value
- confidence: float 0-1 (how confident you are)
- rationale: brief explanation

Infer these fields if possible:
- industry (if not already known)
- target_audience (who they serve)
- brand_personality (tone and style)
- primary_service (main offering)
- unique_value_proposition (what makes them different)

Example format:
{{
  "industry": {{"value": "Legal Services", "confidence": 0.9, "rationale": "Name suggests law firm"}},
  "target_audience": {{"value": "Small businesses", "confidence": 0.7, "rationale": "Inferred from industry"}}
}}

Return ONLY the JSON object, no additional text."""

    try:
        response = ask_gemini(prompt, json_mode=True)
        clean_json = response.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        clean_json = clean_json.strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"[ENRICH] LLM enrichment failed: {e}")
        return {}


def _merge_inferred_fields(
    current_meta: ProjectMeta,
    new_inferences: dict,
    source: str
) -> ProjectMeta:
    """
    Merge new inferred fields into project_meta following rules:
    - Never overwrite user_overrides
    - Only upgrade inferred values if confidence increases
    """
    for field_name, inference_data in new_inferences.items():
        # Rule 1: Never overwrite user_overrides
        if field_name in current_meta.user_overrides:
            print(f"[ENRICH] Skipping {field_name}: user override exists")
            continue

        new_value = inference_data.get("value")
        new_confidence = float(inference_data.get("confidence", 0.0))
        new_rationale = inference_data.get("rationale", "")

        # Rule 2: Only upgrade if confidence increases (or field doesn't exist)
        if field_name in current_meta.inferred:
            existing = current_meta.inferred[field_name]
            if new_confidence <= existing.confidence:
                print(f"[ENRICH] Skipping {field_name}: existing confidence {existing.confidence} >= new {new_confidence}")
                continue

        # Add or upgrade the inferred field
        current_meta.inferred[field_name] = InferredField(
            value=new_value,
            confidence=new_confidence,
            source=source,
            rationale=new_rationale
        )
        print(f"[ENRICH] Updated {field_name}: {new_value} (confidence: {new_confidence})")

    return current_meta


@app.post("/enrich")
async def enrich_project(
    data: dict = Body(default={}),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None)
):
    """
    Enrich project metadata with inferred fields from scraping and LLM analysis.

    - Runs scraping with ~2s timeout (if URL available)
    - Runs LLM enrichment with ~4s timeout
    - Merges inferred fields following rules:
      - Never overwrites user_overrides
      - Only upgrades inferred values if confidence increases
    - Saves and returns updated state
    """
    sid = get_session_id(x_session_id, session_id)
    state = get_state(sid)

    print(f"[ENRICH] Starting enrichment for session: {sid}")

    # Determine URL to scrape (from request body or state)
    url = data.get("url") or state.additional_context.get("business_url")

    scraped_content = ""
    scrape_source = "none"

    # Phase 1: Scrape with timeout (~2s)
    if url:
        try:
            loop = asyncio.get_event_loop()
            scrape_result = await asyncio.wait_for(
                loop.run_in_executor(_executor, _run_scrape_with_timeout, url, 2.0),
                timeout=2.5  # Slightly longer to account for executor overhead
            )
            if scrape_result.get("success"):
                scraped_content = scrape_result.get("content", "")
                scrape_source = "web_scrape"
                state.logs.append(f"Enrich: Scraped {len(scraped_content)} chars from {url}")
                print(f"[ENRICH] Scraped {len(scraped_content)} chars from {url}")
            else:
                state.logs.append(f"Enrich: Scrape failed - {scrape_result.get('error', 'unknown')}")
        except asyncio.TimeoutError:
            state.logs.append(f"Enrich: Scrape timed out for {url}")
            print(f"[ENRICH] Scrape timed out for {url}")
        except Exception as e:
            state.logs.append(f"Enrich: Scrape error - {str(e)}")
            print(f"[ENRICH] Scrape error: {e}")

    # Phase 2: LLM enrichment with timeout (~4s)
    try:
        loop = asyncio.get_event_loop()
        llm_inferences = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _run_llm_enrichment,
                state.project_name,
                state.industry,
                scraped_content
            ),
            timeout=4.5  # Slightly longer to account for executor overhead
        )

        if llm_inferences:
            source = f"enrich_agent:{scrape_source}"
            state.project_meta = _merge_inferred_fields(
                state.project_meta,
                llm_inferences,
                source
            )
            state.logs.append(f"Enrich: Inferred {len(llm_inferences)} fields")
            print(f"[ENRICH] Inferred {len(llm_inferences)} fields")

    except asyncio.TimeoutError:
        state.logs.append("Enrich: LLM enrichment timed out")
        print("[ENRICH] LLM enrichment timed out")
    except Exception as e:
        state.logs.append(f"Enrich: LLM error - {str(e)}")
        print(f"[ENRICH] LLM error: {e}")

    # Save and return
    save_state(sid, state)
    print(f"[ENRICH] Saved enriched state for session: {sid}")

    response = state.model_dump()
    response["_session_id"] = sid
    return response
