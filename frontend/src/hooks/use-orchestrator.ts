"use client";
/**
 * Main orchestrator hook that composes state management and streaming API.
 * 
 * This is a thin orchestration layer that combines:
 * - useWebsiteState: State management and session persistence
 * - useStreamingAPI: Streaming API communication
 * 
 * The orchestrator provides a unified interface for components to interact with
 * the website state and chat functionality.
 */

import { useWebsiteState } from "./useWebsiteState";
import { useStreamingAPI } from "./useStreamingAPI";

// Re-export types for backward compatibility
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AgentReasoning {
  agent_name: string;
  thought: string;
  certainty: number;
}

export interface InferredField {
  value: unknown;
  confidence: number; // 0-1
  source: string; // e.g., "research_agent", "strategy_agent", "user_input"
  rationale: string; // Explanation of why this value was inferred
}

export interface ProjectMeta {
  inferred: Record<string, InferredField>;
  user_overrides: Record<string, unknown>;
}

export interface SitemapPage {
  title: string;
  purpose: string;
  sections: string[];
}

export interface WebsiteState {
  project_name: string;
  industry: string;
  brand_colors: string[];
  design_style: string;
  missing_info: string[];
  logs: string[];
  current_step: string;
  sitemap: SitemapPage[];
  project_brief: string;
  prd_document: string;
  generated_code: string;
  chat_history: Message[];
  project_meta: ProjectMeta;
  agent_reasoning: AgentReasoning[];
  seo_data?: Record<string, unknown> | null;
  ux_strategy?: Record<string, unknown> | null;
  copywriting?: Record<string, unknown> | null;
  context_summary: string;
  additional_context?: Record<string, unknown>;
  crm_data?: Record<string, unknown>;
  _session_id?: string;
}

/**
 * Main orchestrator hook.
 * 
 * Composes state management and streaming API into a unified interface.
 */
export function useOrchestrator() {
  // State management
  const {
    state,
    setState,
    updateChatHistory,
    initializing,
    sessionId,
    error,
    setError,
    startNewProject,
    refreshState,
    clearError,
    loadSession,
    listAllSessions,
    fetchInitialState,
  } = useWebsiteState();

  // Streaming API with callbacks
  // Note: current_step is exclusively managed by backend via state updates
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

  /**
   * Send a message wrapper that combines streaming API with state updates.
   */
  const sendMessage = async (input: string) => {
    await streamMessage(input, state, updateChatHistory);
  };

  return {
    state,
    loading,
    initializing,
    sessionId,
    error,
    sendMessage,
    startNewProject,
    refreshState,
    clearError,
    loadSession,
    listAllSessions,
  };
}
