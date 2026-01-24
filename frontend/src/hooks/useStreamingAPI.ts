/**
 * Hook for handling streaming API communication.
 * 
 * Manages the streaming response from the chat endpoint, parsing state updates,
 * and detecting artifact markers.
 */

import { useState, useCallback } from "react";
import { sendChatMessage, SessionError } from "@/lib/api";
import { STATE_UPDATE_MARKER } from "@/lib/constants";
import {
  parseStateUpdate,
  detectArtifactMarkers,
  generateAssistantMessage,
  cleanMarkdown,
} from "@/lib/stateParser";
import { WebsiteState, Message } from "./use-orchestrator";

export interface StreamingCallbacks {
  onStateUpdate?: (newState: WebsiteState) => void;
  onArtifactDetected?: (type: "sitemap" | "prd") => void;
  onChatUpdate?: (content: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for streaming API communication.
 * 
 * Handles the streaming response from the chat endpoint, parsing state updates
 * and managing the streaming flow.
 * 
 * @param callbacks - Callbacks for handling different streaming events
 * @returns Object with sendMessage function and loading state
 */
export function useStreamingAPI(callbacks: StreamingCallbacks = {}) {
  const [loading, setLoading] = useState(false);
  const {
    onStateUpdate,
    onArtifactDetected,
    onChatUpdate,
    onError,
  } = callbacks;

  /**
   * Send a message to the chat endpoint with streaming support.
   */
  const sendMessage = useCallback(
    async (
      input: string,
      currentState: WebsiteState,
      updateChatHistory: (updater: (prev: Message[]) => Message[]) => void
    ) => {
      if (!input.trim()) return;
      setLoading(true);

      // Optimistically add user message and empty assistant message
      updateChatHistory((prev) => [
        ...prev,
        { role: "user", content: input },
        { role: "assistant", content: "" },
      ]);

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
          const parsedState = parseStateUpdate(fullStreamContent);
          if (parsedState) {
            const currentStep = parsedState.current_step || "";

            // #region agent log
            try {
              fetch(
                "http://127.0.0.1:7242/ingest/5287e8c5-0195-4543-9990-256e4c752e04",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    location: "useStreamingAPI.ts:STATE_UPDATE",
                    message: "State update received",
                    data: {
                      current_step: currentStep,
                      has_generated_code: !!parsedState.generated_code,
                      generated_code_length: parsedState.generated_code?.length || 0,
                    },
                    timestamp: Date.now(),
                    sessionId: "debug-session",
                    runId: "run1",
                    hypothesisId: "B",
                  }),
                }
              ).catch(() => {});
            } catch {}

            // #endregion

            // Generate clean confirmation message
            const parts = fullStreamContent.split(STATE_UPDATE_MARKER);
            const beforeMarker = parts[0]?.trim() || "";
            const assistantFinalText = generateAssistantMessage(
              currentStep,
              parsedState,
              beforeMarker
            );

            // Call state update callback
            if (onStateUpdate) {
              onStateUpdate({
                ...parsedState,
                prd_document: cleanMarkdown(parsedState.prd_document || ""),
              });
            }

            // Update chat history with final message
            updateChatHistory((prev) => [
              ...prev.slice(0, -1),
              { role: "assistant", content: assistantFinalText },
            ]);

            // Reset artifact mode
            isInArtifactMode = false;
            continue;
          }

          // ===== ARTIFACT MODE DETECTION =====
          if (!isInArtifactMode) {
            const markers = detectArtifactMarkers(fullStreamContent);
            
            for (const marker of markers) {
              if (marker.type === "sitemap" && marker.detected) {
                isInArtifactMode = true;
                updateChatHistory((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: "[GENERATING_SITEMAP]" },
                ]);
                if (onArtifactDetected) {
                  onArtifactDetected("sitemap");
                }
                break; // Exit the for loop, then continue the while loop
              }

              if (marker.type === "prd" && marker.detected) {
                isInArtifactMode = true;
                updateChatHistory((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: "[GENERATING_PRD]" },
                ]);
                if (onArtifactDetected) {
                  onArtifactDetected("prd");
                }
                break; // Exit the for loop, then continue the while loop
              }
            }
            
            // If artifact mode was activated, skip to next iteration
            if (isInArtifactMode) {
              continue;
            }
          }

          // ===== ARTIFACT MODE: Keep placeholder, don't stream to chat =====
          if (isInArtifactMode) {
            continue;
          }

          // ===== NORMAL CHAT STREAM =====
          if (onChatUpdate) {
            onChatUpdate(fullStreamContent);
          }
          updateChatHistory((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: fullStreamContent },
          ]);
        }
      } catch (err) {
        if (err instanceof SessionError) {
          // Handle session expiration during chat
          console.warn("[StreamingAPI] Session expired during chat:", err.message);
          if (onError) {
            onError("Your session expired. Starting a new session...");
          }
        } else {
          console.error("[StreamingAPI] Stream error:", err);
          if (onError) {
            onError("Failed to send message. Please try again.");
          }
        }

        // Remove the empty assistant message on error
        updateChatHistory((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
      }
    },
    [onStateUpdate, onArtifactDetected, onChatUpdate, onError]
  );

  return {
    sendMessage,
    loading,
  };
}
