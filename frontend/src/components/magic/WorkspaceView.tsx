"use client";
import React from "react";
import ChatInterface from "./ChatInterface";
import ArtifactWorkspace from "./ArtifactWorkspace";
import AgentStatusIndicator from "./AgentStatusIndicator";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface WorkspaceViewProps {
  state: WebsiteState;
  onSend: (input: string) => void;
  loading: boolean;
}

export default function WorkspaceView({ state, onSend, loading }: WorkspaceViewProps) {
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
