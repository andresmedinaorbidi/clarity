# backend/main.py
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from state_schema import WebsiteState
from agents.intake_agent import run_intake_agent
from agents.planner_agent import run_planner_agent
from agents.prd_agent import run_prd_agent
from agents.router_agent import run_router_agent
from services import mock_hubspot_fetcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allow your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Our 'Database' in memory
project_storage = WebsiteState()

@app.get("/")
def home():
    return {"status": "Backend is online"}

@app.get("/state")
def get_state():
    return project_storage

# This endpoint simulates a user submitting the form
@app.post("/update-project")
def update_project(data: dict = Body(...)):
    global project_storage
    
    # Update the state with what the user sent
    if "project_name" in data:
        project_storage.project_name = data["project_name"]
    if "industry" in data:
        project_storage.industry = data["industry"]
    
    # Run the Intake Agent to check the work!
    project_storage = run_intake_agent(project_storage)
    
    return {"message": "State updated and Agent ran", "state": project_storage}

# backend/main.py (updated endpoint)

@app.post("/fetch-external-data")
def fetch_external_data():
    global project_storage
    company_name = project_storage.project_name
    
    if company_name:
        found_data = mock_hubspot_fetcher(company_name)
        if found_data:
            project_storage.crm_data = found_data
            project_storage.logs.append(f"CRM Fetcher: Found info for {company_name}")
            # Run the agent to update the missing_info list
            project_storage = run_intake_agent(project_storage)
    
    # ALWAYS return the full state object, never just an error string
    return project_storage

@app.post("/run-planner")
def run_planner():
    global project_storage
    
    # Logic: Only run the planner if the Intake is finished
    if project_storage.current_step != "planning":
        return {"error": "Finish the Intake process first!"}

    # Run the Agent
    project_storage = run_planner_agent(project_storage)
    
    return project_storage

@app.post("/run-prd")
def run_prd():
    global project_storage
    
    if not project_storage.sitemap:
        return {"error": "Need a sitemap first!"}

    project_storage = run_prd_agent(project_storage)
    return project_storage

@app.post("/chat")
async def chat(message_data: dict = Body(...)):
    global project_storage
    user_text = message_data.get("message", "")
    
    if not user_text:
        return project_storage

    # Add user message to history
    project_storage.chat_history.append({"role": "user", "content": user_text})
    
    # IMPORTANT: Ensure you are CALLING the function with () 
    # and passing the arguments.
    generator = run_router_agent(project_storage, user_text)
    
     # We add 'headers' and change 'media_type'
    return StreamingResponse(
        run_router_agent(project_storage, user_text),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no", # Disables buffering in most servers
            "Connection": "keep-alive",
        }
    )