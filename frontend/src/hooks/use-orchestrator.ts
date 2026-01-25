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

export interface SitemapPage {
  title: string;
  purpose: string;
  sections: string[];
}

/**
 * PR-02: Represents a machine-inferred field value with metadata.
 * Used in project_meta.inferred to track LLM/scraper suggestions.
 */
export interface InferredField {
  value: unknown;
  confidence?: number;  // 0.0-1.0 (0=low, 1=high)
  source?: string;      // "llm", "scraped", "hybrid", "default"
  rationale?: string;   // Short explanation of inference
}

/**
 * PR-02: Structured project metadata supporting inferred values and user overrides.
 * Extends Record<string, unknown> to allow arbitrary additional keys for backward compatibility.
 */
export type ProjectMeta = Record<string, unknown> & {
  /** Machine-inferred values with confidence/source/rationale metadata */
  inferred?: Record<string, InferredField>;
  /** Explicit user-provided values that override inferred values */
  user_overrides?: Record<string, unknown>;
};

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
  /** PR-02: Now typed with explicit inferred/user_overrides structure */
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
  // PR-01: Backend is the sole authority for steps & state.
  // The frontend does NOT mutate current_step based on artifact detection.
  // Visual placeholders (e.g., [GENERATING_SITEMAP]) are still shown in useStreamingAPI,
  // but step transitions are ONLY driven by backend state updates via |||STATE_UPDATE|||.
  const { sendMessage: streamMessage, loading } = useStreamingAPI({
    onStateUpdate: (newState) => {
      // This is the ONLY place where WebsiteState (including current_step) is updated.
      // The newState comes from the backend via |||STATE_UPDATE||| marker.
      setState(newState);
    },
    // onArtifactDetected intentionally omitted - PR-01 removes client-side step mutations.
    // Visual placeholders are handled in useStreamingAPI without state mutation.
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
