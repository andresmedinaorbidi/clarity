# backend/agents/strategy_agent.py
"""
Strategy Agent - Project Brief Synthesizer

This agent synthesizes all available information (research data, user input, CRM data)
into a comprehensive Project Brief in Markdown format. The brief serves as the
foundation document for user approval before sitemap and design work begins.
"""

import json
import re
from utils import get_filled_prompt, stream_gemini, log_agent_action
from state_schema import WebsiteState, AgentReasoning


def run_strategy_agent(state: WebsiteState, feedback: str = None):
    """
    Strategy Agent: Synthesizes all project information into a Project Brief.

    Creates a comprehensive Markdown document that includes:
    - Executive Summary
    - Target Audience Analysis
    - Value Proposition
    - Brand Voice & Tone
    - Visual Direction
    - Business Goals
    - Strategic Recommendations

    The brief is saved to state.project_brief and key insights are
    extracted to state.project_meta for use by downstream agents.

    Args:
        state: Current WebsiteState
        feedback: Optional feedback for revision mode

    Yields:
        Chunks of Markdown text for streaming display
    """
    # 1. Determine the instruction
    if feedback:
        instruction = f"REVISE the Project Brief based on this user feedback: '{feedback}'. Maintain the same structure but incorporate the requested changes."
        state.logs.append(f"Strategy Agent: Revising brief with feedback: {feedback}")
        yield " 📝 **Revising your Project Brief...** \n\n"
    else:
        instruction = "Create a comprehensive Project Brief that synthesizes all available information about this business."
        state.logs.append("Strategy Agent: Synthesizing Project Brief from research and user input.")
        yield " 📋 **Creating your Project Brief...** \n\n"

    # 2. Prepare data for the prompt template
    state_dict = state.model_dump()
    state_dict['instruction'] = instruction

    # Include research data if available (from Research Agent)
    research_data = state.additional_context.get("research_data", {})
    if research_data:
        state_dict['research_data'] = json.dumps(research_data, indent=2)
        print(f"[STRATEGY] Using research data from: {research_data.get('source', 'unknown')}")
    else:
        state_dict['research_data'] = "No research data available. Please infer based on business name and industry."

    # Include CRM data
    if state.crm_data:
        state_dict['crm_data'] = json.dumps(state.crm_data, indent=2)
    else:
        state_dict['crm_data'] = "No CRM data available."

    # Compile user input context
    user_inputs = []
    if state.project_name:
        user_inputs.append(f"Business Name: {state.project_name}")
    if state.industry:
        user_inputs.append(f"Industry: {state.industry}")
    if state.design_style:
        user_inputs.append(f"Preferred Style: {state.design_style}")
    if state.brand_colors:
        user_inputs.append(f"Brand Colors: {', '.join(state.brand_colors)}")

    # Add any chat context that might be relevant
    recent_user_messages = [
        msg.get("content", "")
        for msg in state.chat_history[-6:]
        if msg.get("role") == "user"
    ]
    if recent_user_messages:
        user_inputs.append(f"Recent Context: {' | '.join(recent_user_messages)}")

    state_dict['user_input'] = "\n".join(user_inputs) if user_inputs else "Minimal user input provided."

    # 3. Load and fill the external prompt file
    filled_prompt = get_filled_prompt("strategy_agent", state_dict)

    # 4. STREAM THE MARKDOWN OUTPUT
    full_response = ""

    try:
        # Stream the brief directly to the user (Markdown mode, not JSON)
        for chunk in stream_gemini(filled_prompt, json_mode=False):
            full_response += chunk
            yield chunk  # Stream each chunk to the frontend

        # 5. CLEAN THE RESPONSE
        # Remove any markdown code block wrappers if present
        clean_brief = full_response.strip()
        if clean_brief.startswith("```markdown"):
            clean_brief = clean_brief[11:]
        if clean_brief.startswith("```"):
            clean_brief = clean_brief[3:]
        if clean_brief.endswith("```"):
            clean_brief = clean_brief[:-3]
        clean_brief = clean_brief.strip()

        # 6. SAVE THE PROJECT BRIEF
        state.project_brief = clean_brief
        print(f"[STRATEGY] Project Brief generated: {len(clean_brief)} characters")

        # 7. EXTRACT KEY INSIGHTS FOR PROJECT_META
        _extract_meta_from_brief(state, clean_brief, research_data)

        # 8. CAPTURE REASONING
        reasoning_text = f"Synthesized Project Brief for {state.project_name}. Combined research data, user input, and industry knowledge into a comprehensive strategy document."
        strategy_reasoning = AgentReasoning(
            agent_name="Strategist",
            thought=reasoning_text,
            certainty=0.90
        )
        state.agent_reasoning.append(strategy_reasoning)

        state.logs.append(f"Strategy Agent: Project Brief complete ({len(clean_brief)} chars)")

    except Exception as e:
        error_msg = f"Strategy Agent Error: {str(e)}"
        print(f"!!! {error_msg}")
        state.logs.append(error_msg)

        # Generate a minimal fallback brief
        if not state.project_brief:
            state.project_brief = _generate_fallback_brief(state)
            yield f"\n\n*[Note: Brief generated with limited data due to processing error]*"

    # 9. Final Terminal Log
    log_agent_action("Strategy Agent", filled_prompt, f"Brief Length: {len(full_response)}")


def _extract_meta_from_brief(state: WebsiteState, brief: str, research_data: dict):
    """
    Extract key strategic insights from the Project Brief and store in project_meta.
    This makes the data available to downstream agents (UX, SEO, Copy, etc.).
    """
    try:
        # Extract business goals from the brief
        goals_match = re.search(r'### Primary Objectives\n((?:[\d]+\..+\n?)+)', brief)
        if goals_match:
            goals_text = goals_match.group(1)
            goals = re.findall(r'\d+\.\s*(.+?)(?:\n|$)', goals_text)
            state.project_meta["business_goals"] = [g.strip() for g in goals[:5]]

        # Extract target audience summary
        audience_match = re.search(r'### Primary Audience\n((?:.+\n?)+?)(?=###|\n\n##|\Z)', brief)
        if audience_match:
            state.project_meta["target_audience"] = audience_match.group(1).strip()[:500]

        # Extract value proposition / core promise
        promise_match = re.search(r'### Core Promise\n(.+?)(?=\n\n|\n###)', brief, re.DOTALL)
        if promise_match:
            state.project_meta["value_proposition"] = promise_match.group(1).strip()

        # Extract brand voice attributes
        voice_match = re.search(r'### Personality Attributes\n((?:.+\n?)+?)(?=###|\n\n##|\Z)', brief)
        if voice_match:
            state.project_meta["brand_voice"] = voice_match.group(1).strip()[:300]

        # Use research data for additional fields if available
        if research_data:
            if not state.project_meta.get("key_services") and research_data.get("key_services"):
                state.project_meta["key_services"] = research_data["key_services"]

            if not state.project_meta.get("market_trends") and research_data.get("market_trends"):
                state.project_meta["market_trends"] = research_data["market_trends"]

            if not state.project_meta.get("competitors") and research_data.get("competitors"):
                state.project_meta["competitors"] = research_data["competitors"]

        # Mark brief as synthesized
        state.project_meta["brief_synthesized"] = True

        print(f"[STRATEGY] Extracted meta: goals={len(state.project_meta.get('business_goals', []))}")

    except Exception as e:
        print(f"[STRATEGY] Meta extraction warning: {str(e)}")
        # Non-critical - brief is still valid even if extraction fails


def _generate_fallback_brief(state: WebsiteState) -> str:
    """
    Generate a minimal fallback brief when the main generation fails.
    """
    return f"""# Project Brief: {state.project_name or 'New Project'}

## Executive Summary
This project aims to create a professional web presence for {state.project_name or 'the business'} in the {state.industry or 'general'} industry.

## Target Audience

### Primary Audience
- **Demographics:** To be defined based on further research
- **Psychographics:** Customers seeking quality {state.industry or 'business'} services

## Value Proposition

### Core Promise
Delivering exceptional value through professional service and quality results.

## Brand Voice & Tone

### Personality Attributes
- **Primary Trait:** Professional
- **Secondary Trait:** Approachable
- **Communication Style:** Clear and confident

## Visual Direction

### Color Palette
{', '.join(state.brand_colors) if state.brand_colors else 'To be determined'}

### Recommended Style
{state.design_style or 'Clean, modern, and professional'}

## Business Goals

### Primary Objectives
1. Establish online presence
2. Generate qualified leads
3. Build brand awareness

---

*This is a preliminary brief. Additional details will be added as more information becomes available.*
"""
