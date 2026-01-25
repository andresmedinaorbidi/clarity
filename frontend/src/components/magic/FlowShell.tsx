"use client";
import React from "react";
import ChatInterface from "./ChatInterface";
import ArtifactWorkspace from "./ArtifactWorkspace";
import AgentStatusIndicator from "./AgentStatusIndicator";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface FlowShellProps {
  state: WebsiteState;
  onSend: (input: string) => void;
  loading: boolean;
}

/**
 * FlowShell - Main workspace shell component after initial intake
 *
 * Manages the split-view layout with:
 * - Left pane: Chat interface with agent status
 * - Right pane: Artifact workspace (sitemap, PRD, preview)
 *
 * Replaces WorkspaceView with a flow-oriented architecture
 * designed for future extensibility (multi-phase views, etc.)
 */
export default function FlowShell({ state, onSend, loading }: FlowShellProps) {
  const lastMsg = state.chat_history[state.chat_history.length - 1];
  const isThinking = loading && lastMsg?.role === "assistant" && lastMsg.content === "";

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Left Pane: Chat Interface (400px fixed) */}
      <div className="w-[400px] flex-shrink-0 border-r border-brand-border flex flex-col">
        {/* Agent Status Indicator */}
        <div className="px-4 pt-3 pb-2 border-b border-brand-border bg-brand-surface">
          <AgentStatusIndicator state={state} loading={loading} />
        </div>
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={state.chat_history}
            onSend={onSend}
            loading={loading}
            isThinking={isThinking}
          />
        </div>
      </div>

      {/* Right Pane: Artifact Workspace (flexible) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ArtifactWorkspace state={state} loading={loading} onSend={onSend} />
      </div>
    </div>
  );
}
