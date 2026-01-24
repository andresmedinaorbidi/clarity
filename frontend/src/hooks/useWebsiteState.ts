/**
 * Hook for managing website state and session persistence.
 * 
 * Handles state initialization, updates, session management, and persistence.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getProjectState,
  createNewSession,
  getSessionId,
  resetSession,
  switchToSession,
  getAllSessions,
  SessionError,
} from "@/lib/api";
import { cleanMarkdown } from "@/lib/stateParser";
import { WebsiteState, Message } from "./use-orchestrator";

const DEFAULT_STATE: WebsiteState = {
  project_name: "",
  industry: "",
  brand_colors: [],
  design_style: "",
  missing_info: [],
  logs: [],
  current_step: "intake",
  sitemap: [],
  project_brief: "",
  prd_document: "",
  generated_code: "",
  chat_history: [],
  project_meta: {},
  agent_reasoning: [],
  seo_data: null,
  ux_strategy: null,
  copywriting: null,
  context_summary: "",
  additional_context: {},
  crm_data: {},
};

/**
 * Hook for managing website state.
 * 
 * Provides state management, session persistence, and state update functions.
 * 
 * @returns State management functions and current state
 */
export function useWebsiteState() {
  const [state, setState] = useState<WebsiteState>(DEFAULT_STATE);
  const [initializing, setInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch existing state from backend on initial load.
   * This allows users to refresh the page without losing progress.
   */
  const fetchInitialState = useCallback(async () => {
    try {
      setInitializing(true);
      setError(null);

      // Get or create session ID
      const sid = getSessionId();
      setSessionId(sid);
      console.log("[WebsiteState] Using session:", sid);

      // Fetch state from backend
      const backendState = await getProjectState();
      console.log("[WebsiteState] Loaded state from backend:", backendState.current_step);

      // Merge backend state with defaults (in case backend has new fields)
      setState((prev) => ({
        ...DEFAULT_STATE,
        ...backendState,
        prd_document: cleanMarkdown(backendState.prd_document || ""),
      }));
    } catch (err) {
      if (err instanceof SessionError) {
        // Session is invalid/expired - reset and try again
        console.warn("[WebsiteState] Session error, resetting:", err.message);
        const newSid = resetSession();
        setSessionId(newSid);
        setError(null);
        // State will be fresh from default
        setState(DEFAULT_STATE);
      } else {
        console.error("[WebsiteState] Failed to fetch initial state:", err);
        setError("Failed to connect to backend. Please ensure the server is running.");
      }
    } finally {
      setInitializing(false);
    }
  }, []);

  // Fetch state on mount
  useEffect(() => {
    fetchInitialState();
  }, [fetchInitialState]);

  /**
   * Update the website state.
   */
  const updateState = useCallback((newState: Partial<WebsiteState> | ((prev: WebsiteState) => WebsiteState)) => {
    setState((prev) => {
      if (typeof newState === "function") {
        return newState(prev);
      }
      return {
        ...prev,
        ...newState,
        prd_document: newState.prd_document !== undefined 
          ? cleanMarkdown(newState.prd_document) 
          : prev.prd_document,
      };
    });
  }, []);

  /**
   * Update chat history.
   */
  const updateChatHistory = useCallback((updater: (prev: Message[]) => Message[]) => {
    setState((prev) => ({
      ...prev,
      chat_history: updater(prev.chat_history),
    }));
  }, []);

  /**
   * Start a completely new project/session.
   */
  const startNewProject = useCallback(async () => {
    try {
      setError(null);

      const { session_id } = await createNewSession();
      setSessionId(session_id);
      setState(DEFAULT_STATE);

      console.log("[WebsiteState] Started new project with session:", session_id);
    } catch (err) {
      console.error("[WebsiteState] Failed to create new session:", err);
      setError("Failed to create new project. Please try again.");
    }
  }, []);

  /**
   * Manually refresh state from backend.
   */
  const refreshState = useCallback(async () => {
    await fetchInitialState();
  }, [fetchInitialState]);

  /**
   * Clear any error messages.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load a specific session by ID.
   * Switches to the session and fetches its state.
   */
  const loadSession = useCallback(async (targetSessionId: string) => {
    try {
      setError(null);

      // Switch to the target session
      switchToSession(targetSessionId);
      setSessionId(targetSessionId);

      // Fetch state for the new session
      const backendState = await getProjectState();
      console.log("[WebsiteState] Loaded session:", targetSessionId, backendState.current_step);

      // Update state with the loaded session data
      setState((prev) => ({
        ...DEFAULT_STATE,
        ...backendState,
        prd_document: cleanMarkdown(backendState.prd_document || ""),
      }));
    } catch (err) {
      console.error("[WebsiteState] Failed to load session:", err);
      setError("Failed to load session. Please try again.");
    }
  }, []);

  /**
   * Get list of all available sessions.
   */
  const listAllSessions = useCallback(async () => {
    try {
      const data = await getAllSessions();
      return data.sessions;
    } catch (err) {
      console.error("[WebsiteState] Failed to list sessions:", err);
      setError("Failed to load sessions list.");
      return [];
    }
  }, []);

  return {
    state,
    setState: updateState,
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
  };
}
