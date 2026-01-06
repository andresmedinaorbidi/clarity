"use client";
import { useState, useEffect } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface WebsiteState {
  project_name: string;
  industry: string;
  missing_info: string[];
  logs: string[];
  current_step: string;
  sitemap: string[];
  prd_document: string;
  generated_code: string;
  chat_history: Message[];
}

export function useOrchestrator() {
  const [state, setState] = useState<WebsiteState>({
    project_name: "",
    industry: "",
    missing_info: [],
    logs: [],
    current_step: "idle",
    sitemap: [],
    prd_document: "",
    generated_code: "",
    chat_history: [],
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

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullStreamContent += chunk;

        if (fullStreamContent.includes("|||STATE_UPDATE|||")) {
          const parts = fullStreamContent.split("|||STATE_UPDATE|||");
          let assistantFinalText = parts[0].trim();
          const jsonString = parts[1].trim();

          // Post-stream clean up: replace raw data with polite message
          if (state.current_step === "planning" || assistantFinalText.includes("1. Home")) {
            assistantFinalText = "I've designed the sitemap for you!";
          } else if (state.current_step === "prd" || assistantFinalText.includes("# Technical")) {
            assistantFinalText = "The technical strategy is ready for review.";
          }

          try {
            const newState = JSON.parse(jsonString);
            setState((prev) => ({
              ...prev,
              ...newState,
              prd_document: cleanMarkdown(newState.prd_document || ""),
              chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: assistantFinalText }],
            }));
          } catch (e) { console.log("JSON partial..."); }
        } else {
          setState((prev) => {
            let currentStep = prev.current_step;
            
            // --- NEW: STEP DETECTION ---
            // Detect if backend signaled a new phase in the text stream
            if (fullStreamContent.includes("Building Sitemap")) currentStep = "planning";
            if (fullStreamContent.includes("Generating Technical PRD")) currentStep = "prd";
            if (fullStreamContent.includes("Starting the Build")) currentStep = "building";

            let displayContent = fullStreamContent;

            if (currentStep === "planning") {
              displayContent = "Architecting sitemap...";
              const lines = fullStreamContent.split("\n").filter(l => l.trim().length > 0 && !l.includes("**"));
              return { ...prev, current_step: currentStep, sitemap: lines, chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: displayContent }] };
            } 

            if (currentStep === "prd") {
              displayContent = "Drafting technical strategy...";
              const prdText = fullStreamContent.split("PRD...**")[1] || fullStreamContent;
              return { ...prev, current_step: currentStep, prd_document: cleanMarkdown(prdText), chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: displayContent }] };
            }

            return { ...prev, current_step: currentStep, chat_history: [...prev.chat_history.slice(0, -1), { role: "assistant", content: fullStreamContent }] };
          });
        }
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return { state, loading, sendMessage };
}