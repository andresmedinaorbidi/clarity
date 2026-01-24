# backend/agents/skill_executor.py
"""
Skill Executor

Handles skill execution, skill chains, and intent-driven skill invocation.
"""

from typing import Generator, Optional
from state_schema import WebsiteState, AgentReasoning
from agents.registry import get_registry, SkillRegistry
from helpers.step_transitions import get_next_step, can_proceed_from_step
from constants import get_gate_name_for_step


def execute_skill(
    state: WebsiteState,
    skill_id: str,
    feedback: Optional[str] = None,
    registry: Optional[SkillRegistry] = None
) -> Generator[str, None, None]:
    """
    Execute a single skill and yield its output.
    Updates state.current_step to reflect the active skill.

    Args:
        state: Current WebsiteState
        skill_id: ID of the skill to execute
        feedback: Optional feedback for revision mode
        registry: SkillRegistry instance (optional, will get default if None)

    Yields:
        Chunks of text from the skill execution
    """
    if registry is None:
        registry = get_registry()

    skill = registry.get(skill_id)
    if not skill:
        print(f"[!] Skill not found: {skill_id}")
        yield f"[Error: Skill '{skill_id}' not found]"
        return

    # Update current step to this skill
    old_step = state.current_step
    state.current_step = skill_id
    state.logs.append(f"System: Executing {skill.name} skill.")

    print(f"[SKILL_EXECUTOR] Executing: {skill.id} ({skill.name})")

    # Emit skill start indicator
    yield f"{skill.icon} **{skill.name}**\n\n"

    # Execute the skill
    try:
        for chunk in skill.execute(state, feedback=feedback):
            yield chunk

        # Log success
        state.logs.append(f"System: {skill.name} completed successfully.")
        print(f"[SKILL_EXECUTOR] Completed: {skill.id}")

    except Exception as e:
        error_msg = f"Skill execution error ({skill.id}): {str(e)}"
        print(f"[!] {error_msg}")
        state.logs.append(f"Error: {error_msg}")
        yield f"\n[Error during {skill.name}: {str(e)}]"


def execute_skill_chain(
    state: WebsiteState,
    start_skill_id: str,
    registry: Optional[SkillRegistry] = None
) -> Generator[str, None, None]:
    """
    Execute a chain of auto-executing skills starting from the given skill.
    Stops at skills that require approval (gates).

    Args:
        state: Current WebsiteState
        start_skill_id: ID of the first skill in the chain
        registry: SkillRegistry instance (optional, will get default if None)

    Yields:
        Chunks of text from all skills in the chain
    """
    # #region agent log
    try:
        import json
        from datetime import datetime
        with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Chain started", "data": {"start_skill_id": start_skill_id, "current_step": state.current_step}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
    except: pass
    # #endregion
    
    if registry is None:
        registry = get_registry()

    current_skill_id = start_skill_id

    while current_skill_id:
        skill = registry.get(current_skill_id)
        if not skill:
            # #region agent log
            try:
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Skill not found, breaking chain", "data": {"current_skill_id": current_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            break

        # #region agent log
        try:
            from datetime import datetime
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Executing skill", "data": {"skill_id": current_skill_id, "skill_name": skill.name, "requires_approval": skill.requires_approval, "auto_execute": skill.auto_execute, "suggested_next": skill.suggested_next}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion

        # Execute this skill
        try:
            yield from execute_skill(state, current_skill_id, registry=registry)
            # #region agent log
            try:
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Skill execution completed", "data": {"skill_id": current_skill_id, "has_generated_code": bool(state.generated_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
        except Exception as e:
            # #region agent log
            try:
                import traceback
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Skill execution error", "data": {"skill_id": current_skill_id, "error": str(e), "traceback": traceback.format_exc()}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            raise

        # Check if this skill requires approval (is a gate)
        if skill.requires_approval:
            print(f"[SKILL_EXECUTOR] Paused at gate: {skill.id}")
            # #region agent log
            try:
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Chain paused at gate", "data": {"skill_id": skill.id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            # Emit gate action marker for frontend approval card
            gate_name = get_gate_name_for_step(skill.id, skill.name)
            yield f"\n\n[GATE_ACTION: {gate_name}]\n"
            break

        # Get the next skill in the chain
        next_skill_id = skill.suggested_next
        if next_skill_id:
            next_skill = registry.get(next_skill_id)
            if next_skill and next_skill.auto_execute:
                print(f"[SKILL_EXECUTOR] Auto-continuing to: {next_skill_id}")
                # #region agent log
                try:
                    from datetime import datetime
                    with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                        f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Auto-continuing to next skill", "data": {"from": current_skill_id, "to": next_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
                except: pass
                # #endregion
                current_skill_id = next_skill_id
            else:
                # #region agent log
                try:
                    from datetime import datetime
                    with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                        f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Chain stopped - next skill not auto-execute", "data": {"current": current_skill_id, "next": next_skill_id, "next_auto_execute": next_skill.auto_execute if next_skill else None}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
                except: pass
                # #endregion
                break
        else:
            # #region agent log
            try:
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_skill_chain", "message": "Chain stopped - no suggested_next", "data": {"current_skill_id": current_skill_id}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion
            break


def execute_intent(
    state: WebsiteState,
    decision,
    user_message: str,
    registry: Optional[SkillRegistry] = None
) -> Generator[str, None, None]:
    """
    Execute the appropriate action based on the Router's intent analysis.
    
    This is the core intent-driven execution engine.

    Args:
        state: Current WebsiteState
        decision: IntentDecision object from IntentAnalyzer
        user_message: Original user message
        registry: SkillRegistry instance (optional, will get default if None)

    Yields:
        Chunks of text from skill execution
    """
    if registry is None:
        registry = get_registry()

    action = decision.action
    requested_skill = decision.requested_skill
    natural_next_step = decision.natural_next_step
    revision_feedback = decision.revision_feedback or user_message

    print(f"[SKILL_EXECUTOR] Action: {action}, Skill: {requested_skill}, Next: {natural_next_step}")

    # -------------------------------------------------------------------------
    # ACTION: INVOKE - Direct skill invocation by user intent
    # -------------------------------------------------------------------------
    if action == "INVOKE" and requested_skill != "none":
        skill = registry.get(requested_skill)

        if skill and skill.can_invoke_directly:
            # Check prerequisites (warn but don't block)
            missing_prereqs = registry.check_prerequisites(requested_skill, state)
            if missing_prereqs:
                prereq_names = [registry.get(p).name for p in missing_prereqs if registry.get(p)]
                print(f"[SKILL_EXECUTOR] Warning: Missing prerequisites for {requested_skill}: {missing_prereqs}")
                state.logs.append(f"Note: Invoking {skill.name} without completing: {', '.join(prereq_names)}")

            # Execute the skill with revision feedback if provided
            yield from execute_skill(state, requested_skill, feedback=revision_feedback, registry=registry)

            # Emit gate marker if skill requires approval
            if skill.requires_approval:
                gate_name = get_gate_name_for_step(skill.id, skill.name)
                yield f"\n\n[GATE_ACTION: {gate_name}]\n"

            # Log the reasoning
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User intent detected: Invoke {skill.name}. {decision.reasoning}",
                certainty=decision.certainty
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append(f"System: Cannot directly invoke skill '{requested_skill}'")
            print(f"[!] Skill cannot be invoked directly: {requested_skill}")

    # -------------------------------------------------------------------------
    # ACTION: REVISE - Modify existing work for a skill
    # -------------------------------------------------------------------------
    elif action == "REVISE":
        # Use requested_skill if specified, otherwise revise current step
        target_skill_id = requested_skill if requested_skill != "none" else state.current_step
        skill = registry.get(target_skill_id)

        if skill and skill.revision_supported:
            print(f"[SKILL_EXECUTOR] Revising: {target_skill_id}")

            yield from execute_skill(state, target_skill_id, feedback=revision_feedback, registry=registry)

            # Emit gate marker if skill requires approval
            if skill.requires_approval:
                gate_name = get_gate_name_for_step(skill.id, skill.name)
                yield f"\n\n[GATE_ACTION: {gate_name}]\n"

            # Log the revision
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User requested revision of {skill.name}. Feedback: {revision_feedback[:100]}...",
                certainty=decision.certainty
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append(f"System: Revision not supported for '{target_skill_id}'")
            print(f"[!] Revision not supported: {target_skill_id}")

    # -------------------------------------------------------------------------
    # ACTION: PROCEED - Move to next step in the flow
    # -------------------------------------------------------------------------
    elif action == "PROCEED":
        # #region agent log
        try:
            import json
            from datetime import datetime
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_intent", "message": "PROCEED action detected", "data": {"current_step": state.current_step, "user_message": user_message}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion
        
        # Check if we can proceed from current step
        if not can_proceed_from_step(state.current_step, state):
            print(f"[SKILL_EXECUTOR] Cannot proceed from {state.current_step}: missing required information")
            state.logs.append("System: Cannot proceed - still missing required information.")
            return
        
        # Determine next step using transition utility
        target_step = get_next_step(
            current_step=state.current_step,
            action=action,
            registry=registry,
            natural_next_step=natural_next_step
        )

        # #region agent log
        try:
            from datetime import datetime
            with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_intent", "message": "PROCEED target determined", "data": {"current_step": state.current_step, "target_step": target_step}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        except: pass
        # #endregion

        if target_step:
            print(f"[SKILL_EXECUTOR] Proceeding to: {target_step}")

            # Execute the skill chain starting from target
            yield from execute_skill_chain(state, target_step, registry=registry)
            
            # #region agent log
            try:
                from datetime import datetime
                with open(r"c:\Users\Administrador\Desktop\clarity by plinng\.cursor\debug.log", "a", encoding="utf-8") as f:
                    f.write(json.dumps({"timestamp": datetime.now().isoformat(), "location": "skill_executor.py:execute_intent", "message": "Skill chain execution completed", "data": {"target_step": target_step, "final_step": state.current_step, "has_generated_code": bool(state.generated_code)}, "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
            except: pass
            # #endregion

            # Log progression
            reasoning = AgentReasoning(
                agent_name="Router",
                thought=f"User approved progression. Moving from {state.current_step} to {target_step} phase.",
                certainty=decision.certainty
            )
            state.agent_reasoning.append(reasoning)
        else:
            state.logs.append("System: Already at final step or no next step available.")
            print("[SKILL_EXECUTOR] No next step available")
