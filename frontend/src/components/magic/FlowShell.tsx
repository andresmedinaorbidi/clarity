"use client";
/**
 * FlowShell - Primary post-hero UI container (PR-06, PR-07)
 *
 * Implements a linear, full-screen UX flow:
 * 1. Magical Intake (MagicalIntakeView with all fields in cards)
 * 2. Loading screen (placeholder for PR-09)
 * 3. Website Preview (when generated_code exists)
 *
 * This component replaces WorkspaceView as the default post-hero view.
 * It does NOT manage state transitions - backend is sole authority.
 */

import React, { useState, useCallback } from "react";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import MagicalIntakeView from "@/components/intake/MagicalIntakeView";

interface FlowShellProps {
  state: WebsiteState;
  sendMessage: (text: string) => Promise<void>;
  loading?: boolean;
}

/**
 * Full-screen Website Preview
 * Renders generated_code in an iframe
 */
function WebsitePreview({ state }: { state: WebsiteState }) {
  return (
    <div className="h-full flex flex-col bg-brand-dark">
      {/* Minimal header */}
      <div className="flex-shrink-0 h-12 border-b border-border-subtle flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-text-secondary">
            {state.project_name || "Your Website"} — Preview
          </span>
        </div>
      </div>

      {/* Full-screen iframe */}
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={state.generated_code}
          title="Website Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

/**
 * FlowShell - Main routing component
 *
 * Routing logic:
 * 1. If generated_code exists and is non-empty -> WebsitePreview
 * 2. Else -> MagicalIntakeView (single-screen magical intake)
 *
 * Future additions:
 * - PR-09: Loading screen between intake and preview
 */
export default function FlowShell({ state, sendMessage, loading }: FlowShellProps) {
  // Local state mirror for immediate updates after /update-project
  const [localState, setLocalState] = useState<WebsiteState>(state);

  // Sync with prop state when it changes from parent
  React.useEffect(() => {
    setLocalState(state);
  }, [state]);

  // Handler for state updates from MagicalIntakeView
  const handleStateUpdated = useCallback((newState: WebsiteState) => {
    setLocalState(newState);
  }, []);

  // Handler for "Create Website" button
  // Just calls sendMessage("Proceed") to start the pipeline
  // PR-09 will add a loading screen before this
  const handleCreateWebsite = useCallback(async () => {
    try {
      await sendMessage("Proceed");
    } catch (error) {
      console.error("[FlowShell] Failed to start website creation:", error);
    }
  }, [sendMessage]);

  // Determine which screen to show based on state
  const hasGeneratedCode = localState.generated_code && localState.generated_code.length > 0;

  return (
    <div className="h-full w-full">
      {hasGeneratedCode ? (
        <WebsitePreview state={localState} />
      ) : (
        <MagicalIntakeView
          state={localState}
          onStateUpdated={handleStateUpdated}
          onCreateWebsite={handleCreateWebsite}
        />
      )}
    </div>
  );
}
