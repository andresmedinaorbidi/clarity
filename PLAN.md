# Plan: Remove Frontend `current_step` Mutation Logic

## Goal
Remove all frontend logic that directly mutates `current_step` in `use-orchestrator.ts`. The backend should be the single source of truth for step transitions via state updates.

---

## Analysis

### Current Problem
In `use-orchestrator.ts` (lines 86-93), the `onArtifactDetected` callback directly mutates `current_step`:

```typescript
onArtifactDetected: (type) => {
  if (type === "sitemap") {
    setState((prev) => ({ ...prev, current_step: "planning" }));
  } else if (type === "prd") {
    setState((prev) => ({ ...prev, current_step: "prd" }));
  }
},
```

This creates a dual-source-of-truth problem where both frontend and backend can set `current_step`, leading to race conditions and state inconsistencies.

### Solution
Remove the `onArtifactDetected` callback entirely. The backend already sends `current_step` in the state update via the `|||STATE_UPDATE|||` marker, so `onStateUpdate: setState(newState)` will naturally update `current_step` with the correct value from the backend.

---

## Changes to Make

### File: `frontend/src/hooks/use-orchestrator.ts`

**Before (lines 82-105):**
```typescript
const { sendMessage: streamMessage, loading } = useStreamingAPI({
  onStateUpdate: (newState) => {
    setState(newState);
  },
  onArtifactDetected: (type) => {
    // Update state when artifact is detected
    if (type === "sitemap") {
      setState((prev) => ({ ...prev, current_step: "planning" }));
    } else if (type === "prd") {
      setState((prev) => ({ ...prev, current_step: "prd" }));
    }
  },
  onChatUpdate: (content) => {
    // Chat updates are handled by updateChatHistory in the streaming hook
  },
  onError: (errorMessage) => {
    // Set error state
    setError(errorMessage);
    // Error handling - fetchInitialState will handle session errors
    if (errorMessage.includes("session expired")) {
      fetchInitialState();
    }
  },
});
```

**After:**
```typescript
const { sendMessage: streamMessage, loading } = useStreamingAPI({
  onStateUpdate: (newState) => {
    setState(newState);
  },
  onError: (errorMessage) => {
    setError(errorMessage);
    if (errorMessage.includes("session expired")) {
      fetchInitialState();
    }
  },
});
```

**Removed:**
1. `onArtifactDetected` callback - Was directly mutating `current_step`
2. `onChatUpdate` callback - Was empty/no-op anyway

**Kept:**
1. `onStateUpdate` - Primary mechanism for state sync from backend
2. `onError` - Essential for error handling (does not mutate `current_step`)

---

### File: `SYSTEM_ARTIFACT.md`

Update section **6.3 State Synchronization Contract** to reflect that frontend no longer mutates `current_step`:

Add clarification that `current_step` is exclusively managed by backend.

Update **Last Updated** section with new date.

---

## Impact Analysis

- **No backend changes required** - Backend already sends correct `current_step` in state updates
- **No breaking changes** - `useStreamingAPI` callbacks are all optional
- **Improved reliability** - Single source of truth for step transitions
- **Artifact detection still works** - `useStreamingAPI.ts` still detects artifacts and shows placeholders in chat, it just won't trigger step changes

---

## Files Modified

1. `frontend/src/hooks/use-orchestrator.ts` - Remove `onArtifactDetected` and `onChatUpdate` callbacks
2. `SYSTEM_ARTIFACT.md` - Document the architectural clarification

---

## Verification

After changes:
1. `current_step` should only change when backend sends a state update
2. Artifact detection placeholders (`[GENERATING_SITEMAP]`, `[GENERATING_PRD]`) should still appear
3. No TypeScript errors (callbacks are optional in `StreamingCallbacks` interface)
