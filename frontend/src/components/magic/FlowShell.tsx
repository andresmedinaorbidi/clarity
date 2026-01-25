"use client";
/**
 * FlowShell - Primary post-hero UI container (PR-06)
 *
 * Implements a linear, full-screen UX flow:
 * 1. Guided Intake (placeholder for PR-07)
 * 2. Loading screen (placeholder for PR-09)
 * 3. Website Preview (when generated_code exists)
 *
 * This component replaces WorkspaceView as the default post-hero view.
 * It does NOT manage state transitions - backend is sole authority.
 */

import React from "react";
import { motion } from "framer-motion";
import type { WebsiteState } from "@/hooks/use-orchestrator";

interface FlowShellProps {
  state: WebsiteState;
  sendMessage: (text: string) => Promise<void>;
  loading?: boolean;
}

/**
 * Placeholder Intake Screen (PR-06)
 * Will be replaced by GuidedIntakeView in PR-07
 */
function PlaceholderIntake({
  state,
  loading
}: {
  state: WebsiteState;
  loading?: boolean;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-brand-dark px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-purple/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-accent-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-text-primary mb-3">
          Let&apos;s set up your website
        </h1>

        {/* Subtext */}
        <p className="text-text-secondary mb-8">
          Guided intake will be added in PR-07.
          <br />
          <span className="text-text-muted text-sm">
            Current step: {state.current_step || "intake"}
          </span>
        </p>

        {/* Status indicator */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-accent-purple">
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <p className="text-text-muted text-sm">
            Waiting for intake UI in PR-07
          </p>
        )}

        {/* Debug info (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-surface-dark/50 rounded-lg text-left text-xs text-text-muted font-mono">
            <p>Debug Info:</p>
            <p>project_name: {state.project_name || "(empty)"}</p>
            <p>industry: {state.industry || "(empty)"}</p>
            <p>current_step: {state.current_step}</p>
            <p>chat_history: {state.chat_history.length} messages</p>
          </div>
        )}
      </motion.div>
    </div>
  );
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
 * Routing logic (PR-06 minimal):
 * 1. If generated_code exists and is non-empty -> WebsitePreview
 * 2. Else -> PlaceholderIntake (to be replaced by GuidedIntakeView in PR-07)
 *
 * Future additions:
 * - PR-07: GuidedIntakeView with pickers
 * - PR-09: Loading screen between intake and preview
 */
export default function FlowShell({ state, sendMessage, loading }: FlowShellProps) {
  // Determine which screen to show based on state
  const hasGeneratedCode = state.generated_code && state.generated_code.length > 0;

  return (
    <div className="h-full w-full">
      {hasGeneratedCode ? (
        <WebsitePreview state={state} />
      ) : (
        <PlaceholderIntake state={state} loading={loading} />
      )}
    </div>
  );
}
