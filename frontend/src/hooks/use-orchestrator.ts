"use client";
import { useState, useEffect } from "react";

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

export interface ProgressEvent {
  timestamp: string;
  phase: string;
  message: string;
  artifact_refs?: string[];
}

export interface Assumptions {
  suggested: Record<string, any>;
  approved: Record<string, any>;
}

export interface WebsiteState {
  project_name: string;
  industry: string;
  brand_colors: string[];
  design_style: string;
  missing_info: string[];
  logs: string[];
  current_step: string;
  sitemap: SitemapPage[];  // High-fidelity: [{title, purpose, sections}]
  prd_document: string;
  generated_code: string;
  chat_history: Message[];
  project_meta: Record<string, any>;  // Includes inferred_fields: string[]
  agent_reasoning: AgentReasoning[];
  seo_data?: Record<string, any> | null;
  ux_strategy?: Record<string, any> | null;
  copywriting?: Record<string, any> | null;
  context_summary: string;

  // Magical Flow additions
  progress_events: ProgressEvent[];
  assumptions: Assumptions;
  direction_snapshot: string;
  reveal_feedback: string[];
}

export function useOrchestrator() {
  const [state, setState] = useState<WebsiteState>({
    project_name: "",
    industry: "",
    brand_colors: [],
    design_style: "",
    missing_info: [],
    logs: [],
    current_step: "idle",
    sitemap: [],
    progress_events: [],
    assumptions: { suggested: {}, approved: {} },
    direction_snapshot: "",
    reveal_feedback: [],
    prd_document: "",
    generated_code: "",
    chat_history: [],
    project_meta: {},
    agent_reasoning: [],
    seo_data: null,
    ux_strategy: null,
    copywriting: null,
    context_summary: "",
  });
  const [loading, setLoading] = useState(false);

  const cleanMarkdown = (text: string) => {
    if (!text) return "";
    return text.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/```markdown/g, "").replace(/```/g, "").trim();
  };

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    setLoading(true);

    setState((prev) => ({
      ...prev,
      chat_history: [...prev.chat_history, { role: "user", content: input }, { role: "assistant", content: "" }],
    }));

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullStreamContent = "";
      let isInArtifactMode = false;
      let artifactType: "sitemap" | "prd" | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullStreamContent += chunk;

        // ===== STATE UPDATE DETECTION (Priority) =====
        if (fullStreamContent.includes("|||STATE_UPDATE|||")) {
          const parts = fullStreamContent.split("|||STATE_UPDATE|||");
          const jsonString = parts[1].trim();

          try {
            const newState = JSON.parse(jsonString);
            const currentStep = newState.current_step || "";

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

            setState((prev) => ({
              ...prev,
              ...newState,
              prd_document: cleanMarkdown(newState.prd_document || prev.prd_document),
              chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: assistantFinalText }],
            }));

            // Reset artifact mode
            isInArtifactMode = false;
            artifactType = null;
          } catch (e) {
            console.log("JSON partial...", e);
          }
          continue; // Skip normal processing when STATE_UPDATE is found
        }

        // ===== ARTIFACT MODE DETECTION =====
        // Detect when we enter artifact generation phase
        if (!isInArtifactMode) {
          if (fullStreamContent.includes("🏗️ **Building Sitemap")) {
            isInArtifactMode = true;
            artifactType = "sitemap";
            setState((prev) => ({
              ...prev,
              current_step: "planning",
              chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: "[GENERATING_SITEMAP]" }],
            }));
            continue; // Skip normal processing
          }

          if (fullStreamContent.includes("📋 **Drafting Technical")) {
            isInArtifactMode = true;
            artifactType = "prd";
            setState((prev) => ({
              ...prev,
              current_step: "prd",
              chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: "[GENERATING_PRD]" }],
            }));
            continue; // Skip normal processing
          }
        }

        // ===== ARTIFACT MODE: Keep placeholder, don't stream to chat =====
        if (isInArtifactMode) {
          // Backend updates state.sitemap and state.prd_document directly
          // We just need to keep the placeholder in chat_history
          // The STATE_UPDATE will handle the final transition
          continue;
        }

        // ===== NORMAL CHAT STREAM =====
        setState((prev) => ({
          ...prev,
          chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: fullStreamContent }],
        }));
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, sendMessage };
}