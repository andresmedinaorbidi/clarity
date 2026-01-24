# backend/agents/intent_analyzer.py
"""
Intent Analyzer

Pure intent extraction module. Analyzes user messages to determine intent
without any side effects. Returns structured intent decisions.
"""

import json
from typing import Dict, Any
from state_schema import WebsiteState, AgentReasoning
from utils import get_filled_prompt, ask_gemini
from agents.registry import get_registry


class IntentDecision:
    """Structured intent decision from the analyzer."""
    
    def __init__(self, raw_decision: Dict[str, Any]):
        self.action = raw_decision.get("action", "CHAT")
        self.requested_skill = raw_decision.get("requested_skill", "none")
        self.natural_next_step = raw_decision.get("natural_next_step")
        self.revision_feedback = raw_decision.get("revision_feedback", "")
        self.reasoning = raw_decision.get("reasoning", "Processing user request")
        self.certainty = raw_decision.get("certainty", 0.8)
        self.assumptions = raw_decision.get("assumptions", [])
        self.updates = raw_decision.get("updates", {})
        self.raw = raw_decision


def analyze_intent(state: WebsiteState, user_message: str) -> IntentDecision:
    """
    Analyze user message to determine intent.
    
    Pure function with no side effects. Only analyzes and returns decision.
    
    Args:
        state: Current WebsiteState
        user_message: User's chat message
        
    Returns:
        IntentDecision object with parsed intent information
    """
    print(f"[INTENT_ANALYZER] Analyzing intent for: {user_message[:50]}...")
    
    registry = get_registry()
    
    # Prepare state dictionary for prompt
    state_dict = state.model_dump()
    state_dict['user_message'] = user_message
    
    # Add state indicators for the prompt
    state_dict['has_research'] = "Yes" if state.additional_context.get("research_data") else "No"
    state_dict['has_brief'] = "Yes" if state.project_brief else "No"
    state_dict['has_sitemap'] = "Yes" if state.sitemap else "No"
    state_dict['has_seo'] = "Yes" if state.seo_data else "No"
    state_dict['has_copy'] = "Yes" if state.copywriting else "No"
    state_dict['has_prd'] = "Yes" if state.prd_document else "No"
    
    # Add skill descriptions for intent matching
    state_dict['skill_descriptions'] = registry.get_skill_descriptions_for_prompt()
    
    print(f"[INTENT_ANALYZER] Loading prompt with skill descriptions")
    filled_prompt = get_filled_prompt("router_agent", state_dict)
    
    # Call Gemini for intent analysis
    print(f"[INTENT_ANALYZER] Calling Gemini for intent analysis...")
    extraction_raw = ask_gemini(filled_prompt, json_mode=True)
    
    # Clean JSON response
    clean_json = extraction_raw.strip()
    if "```" in clean_json:
        clean_json = clean_json.split("```")[1]
        if clean_json.startswith("json"):
            clean_json = clean_json[4:]
    clean_json = clean_json.strip()
    
    try:
        decision = json.loads(clean_json)
        print(f"[INTENT_ANALYZER] Decision: action={decision.get('action')}, skill={decision.get('requested_skill')}")
    except Exception as e:
        print(f"[!] JSON parse error: {e}")
        decision = {"action": "CHAT", "requested_skill": "none", "updates": {}}
    
    return IntentDecision(decision)
