import json
from utils import get_filled_prompt, stream_gemini, log_agent_action, emit_progress_event
from state_schema import WebsiteState, AgentReasoning

def run_reveal_agent(state: WebsiteState, feedback: str = None):
    """
    Reveal Agent: Interactive preview and feedback collection phase.

    This agent:
    - Presents the generated website for review
    - Collects user feedback
    - Can trigger refinements (copy, design, structure)
    - Does NOT block progress (feedback is optional)
    """

    # Emit progress
    emit_progress_event(state, "reveal", "Preparing interactive preview...")

    if feedback:
        # User provided feedback - log it
        state.reveal_feedback.append(feedback)
        state.logs.append(f"Reveal: Feedback received: {feedback[:100]}")

        # Parse feedback intent
        state_dict = state.model_dump()
        state_dict['feedback'] = feedback
        state_dict['format_instructions'] = """Return JSON with:
{
  "refinement_type": "copy" | "design" | "structure" | "none",
  "specific_changes": ["Change 1", "Change 2"],
  "reasoning": "What the user wants"
}"""

        filled_prompt = get_filled_prompt("reveal_agent", state_dict)

        yield "🔍 **Analyzing feedback...**\n\n"

        full_response = ""
        try:
            for chunk in stream_gemini(filled_prompt, json_mode=True):
                full_response += chunk
                yield ""

            clean_json = full_response.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.split("\n", 1)[-1].rsplit("\n", 1)[0].strip()
            if clean_json.startswith("json"):
                clean_json = clean_json[4:].strip()

            data = json.loads(clean_json)

            refinement_type = data.get("refinement_type", "none")
            specific_changes = data.get("specific_changes", [])

            # Log the refinement intent
            reasoning = AgentReasoning(
                agent_name="Reveal",
                thought=data.get("reasoning", "Feedback analyzed"),
                certainty=0.8
            )
            state.agent_reasoning.append(reasoning)

            emit_progress_event(
                state,
                "reveal",
                f"Feedback categorized as: {refinement_type}",
                artifact_refs=["reveal_feedback"]
            )

            yield f"✅ I understand - you want to refine: **{refinement_type}**\n\n"

            log_agent_action("Reveal Agent", filled_prompt, full_response)

        except Exception as e:
            print(f"[REVEAL ERROR] {str(e)}")
            yield "I've logged your feedback. You can continue refining or proceed to launch.\n\n"

    else:
        # Initial reveal - present the website
        yield "🎉 **Your Website is Ready!**\n\n"
        yield "Review the interactive preview above. You can provide feedback for refinements, or we can proceed to launch.\n\n"

        emit_progress_event(state, "reveal", "Website revealed to user", artifact_refs=["generated_code"])

        state.logs.append("Reveal: Website presented to user for review.")
