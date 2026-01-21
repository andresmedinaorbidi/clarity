"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getProjectState,
  sendChatMessage,
  createNewSession,
  getSessionId,
  resetSession,
  SessionError,
} from "@/lib/api";
import { STATE_UPDATE_MARKER, GATE_ACTION_PATTERN } from "@/lib/constants";

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
  project_meta: Record<string, unknown>;
  agent_reasoning: AgentReasoning[];
  seo_data?: Record<string, unknown> | null;
  ux_strategy?: Record<string, unknown> | null;
  copywriting?: Record<string, unknown> | null;
  context_summary: string;
  additional_context?: Record<string, unknown>;
  crm_data?: Record<string, unknown>;
  _session_id?: string;
}

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

export function useOrchestrator() {
  const [state, setState] = useState<WebsiteState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/```markdown/g, "")
      .replace(/```/g, "")
      .trim();
  };

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
      console.log("[Orchestrator] Using session:", sid);

      // Fetch state from backend
      const backendState = await getProjectState();
      console.log("[Orchestrator] Loaded state from backend:", backendState.current_step);

      // Merge backend state with defaults (in case backend has new fields)
      setState((prev) => ({
        ...DEFAULT_STATE,
        ...backendState,
        prd_document: cleanMarkdown(backendState.prd_document || ""),
      }));
    } catch (err) {
      if (err instanceof SessionError) {
        // Session is invalid/expired - reset and try again
        console.warn("[Orchestrator] Session error, resetting:", err.message);
        const newSid = resetSession();
        setSessionId(newSid);
        setError(null);
        // State will be fresh from default
        setState(DEFAULT_STATE);
      } else {
        console.error("[Orchestrator] Failed to fetch initial state:", err);
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
   * Start a completely new project/session.
   */
  const startNewProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { session_id } = await createNewSession();
      setSessionId(session_id);
      setState(DEFAULT_STATE);

      console.log("[Orchestrator] Started new project with session:", session_id);
    } catch (err) {
      console.error("[Orchestrator] Failed to create new session:", err);
      setError("Failed to create new project. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send a message to the chat endpoint with streaming support.
   */
  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    // Optimistically add user message and empty assistant message
    setState((prev) => ({
      ...prev,
      chat_history: [
        ...prev.chat_history,
        { role: "user", content: input },
        { role: "assistant", content: "" },
      ],
    }));

    try {
      const response = await sendChatMessage(input);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullStreamContent = "";
      let isInArtifactMode = false;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullStreamContent += chunk;

                // ===== STATE UPDATE DETECTION (Priority) =====
                if (fullStreamContent.includes(STATE_UPDATE_MARKER)) {
                  const parts = fullStreamContent.split(STATE_UPDATE_MARKER);
          const jsonString = parts[1].trim();

          try {
            const newState = JSON.parse(jsonString);
            const currentStep = newState.current_step || "";

            // #region agent log
            try {
              fetch('http://127.0.0.1:7242/ingest/5287e8c5-0195-4543-9990-256e4c752e04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-orchestrator.ts:STATE_UPDATE',message:'State update received',data:{current_step:currentStep,has_generated_code:!!newState.generated_code,generated_code_length:newState.generated_code?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            } catch {}
            // #endregion

            // Generate clean confirmation message
            let assistantFinalText = "";
            if (currentStep === "planning" || newState.sitemap?.length > 0) {
              assistantFinalText = "Sitemap finalized! Take a look.";
            } else if (currentStep === "prd" || newState.prd_document) {
              assistantFinalText = "System specifications are ready for review.";
            } else if (currentStep === "building" || newState.generated_code) {
              assistantFinalText = "Building your website now...";
            } else {
              // Extract actual assistant message if present
              const beforeMarker = parts[0].trim();
              const cleanedText = beforeMarker
                .replace(/🏗️ \*\*Building Sitemap\*\*.*$/s, "")
                .replace(/📋 \*\*Drafting Technical.*?\*\*.*$/s, "")
                .replace(/🚀 \*\*Starting Build\*\*.*$/s, "")
                .replace(/🏗️.*Architecting.*$/gm, "")
                .replace(/\n{2,}/g, "\n")
                .trim();
              assistantFinalText = cleanedText || "Processing complete!";
            }

            setState((prev) => {
              const updated = {
                ...prev,
                ...newState,
                prd_document: cleanMarkdown(newState.prd_document || prev.prd_document),
                chat_history: [
                  ...prev.chat_history.slice(0, -1),
                  { role: "assistant", content: assistantFinalText },
                ],
              };
              
              // #region agent log
              try {
                fetch('http://127.0.0.1:7242/ingest/5287e8c5-0195-4543-9990-256e4c752e04',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-orchestrator.ts:setState',message:'State updated',data:{current_step:updated.current_step,has_generated_code:!!updated.generated_code,generated_code_length:updated.generated_code?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              } catch {}
              // #endregion
              
              return updated;
            });

            // Reset artifact mode
            isInArtifactMode = false;
          } catch (e) {
            console.log("JSON partial...", e);
          }
          continue;
        }

        // ===== ARTIFACT MODE DETECTION =====
        if (!isInArtifactMode) {
          if (fullStreamContent.includes("🏗️ **Building Sitemap")) {
            isInArtifactMode = true;
            setState((prev) => ({
              ...prev,
              current_step: "planning",
              chat_history: [
                ...prev.chat_history.slice(0, -1),
                { role: "assistant", content: "[GENERATING_SITEMAP]" },
              ],
            }));
            continue;
          }

          if (fullStreamContent.includes("📋 **Drafting Technical")) {
            isInArtifactMode = true;
            setState((prev) => ({
              ...prev,
              current_step: "prd",
              chat_history: [
                ...prev.chat_history.slice(0, -1),
                { role: "assistant", content: "[GENERATING_PRD]" },
              ],
            }));
            continue;
          }
        }

        // ===== ARTIFACT MODE: Keep placeholder, don't stream to chat =====
        if (isInArtifactMode) {
          continue;
        }

        // ===== NORMAL CHAT STREAM =====
        setState((prev) => ({
          ...prev,
          chat_history: [
            ...prev.chat_history.slice(0, -1),
            { role: "assistant", content: fullStreamContent },
          ],
        }));
      }
    } catch (err) {
      if (err instanceof SessionError) {
        // Handle session expiration during chat
        console.warn("[Orchestrator] Session expired during chat:", err.message);
        setError("Your session expired. Starting a new session...");
        await fetchInitialState();
      } else {
        console.error("[Orchestrator] Stream error:", err);
        setError("Failed to send message. Please try again.");

        // Remove the empty assistant message on error
        setState((prev) => ({
          ...prev,
          chat_history: prev.chat_history.slice(0, -1),
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchInitialState]);

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
  };
}
