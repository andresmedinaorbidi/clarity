// src/components/magic/ChatInterface.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import SmoothText from "./SmoothText";
import ApprovalCard from "./ApprovalCard";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (input: string) => void;
  loading: boolean;
  isThinking?: boolean;
}

// Parse gate action from message content
function parseGateAction(content: string): string | null {
  const gateMatch = content.match(/\[GATE_ACTION:\s*([^\]]+)\]/);
  return gateMatch ? gateMatch[1].trim() : null;
}

// Sanitize text to remove JSON structures and technical content
function sanitizeText(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove JSON objects (e.g., {"key": "value"})
  cleaned = cleaned.replace(/\{[^{}]*"([^"]+)":\s*"([^"]+)"[^{}]*\}/g, "");
  
  // Remove JSON arrays (e.g., ["item1", "item2"])
  cleaned = cleaned.replace(/\["([^"]+)",\s*"([^"]+)"[^\]]*\]/g, "");
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`[^`]+`/g, "");
  
  // Remove JSON-like structures with curly braces (longer ones)
  cleaned = cleaned.replace(/\{[^}]{20,}\}/g, "");
  
  // Remove array-like structures (longer ones)
  cleaned = cleaned.replace(/\[[^\]]{20,}\]/g, "");
  
  // Remove common JSON keys that might leak
  cleaned = cleaned.replace(/["']?(primary|secondary|characteristics|demographics|psychographics|trait|communication|style)["']?\s*[:=]\s*["']?/gi, "");
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

// Remove gate markers and sanitize content
function cleanMessageContent(content: string): string {
  let cleaned = content.replace(/\[GATE_ACTION:\s*[^\]]+\]/g, "").trim();
  
  // Only sanitize if not in Advanced Mode (to preserve technical details for power users)
  // But always remove obvious JSON leaks
  cleaned = cleaned.replace(/\{[^{}]*"([^"]+)":\s*"([^"]+)"[^{}]*\}/g, "");
  cleaned = cleaned.replace(/\["([^"]+)",\s*"([^"]+)"[^\]]*\]/g, "");
  
  return cleaned;
}

export default function ChatInterface({ messages, onSend, loading, isThinking }: ChatInterfaceProps) {
  const { isAdvancedMode } = useAdvancedMode();
  const [input, setInput] = React.useState("");
  const [processedApprovals, setProcessedApprovals] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input);
      setInput("");
    }
  };

  const handleApprove = (messageIndex: number) => {
    // Mark this approval as processed
    setProcessedApprovals((prev) => new Set([...prev, messageIndex]));
    // Send "Proceed" message
    onSend("Proceed");
  };

  const handleRequestChanges = () => {
    // Focus the input so user can type feedback
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface">
      {/* Header removed - Agent status is now shown in WorkspaceView */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, i) => {
          const isLastMessage = i === messages.length - 1;
          const isAssistant = msg.role === "assistant";

          // Check for specific artifact generation placeholders
          const isGeneratingSitemap = msg.content === "[GENERATING_SITEMAP]";
          const isGeneratingPRD = msg.content === "[GENERATING_PRD]";
          const isGeneratingArtifact = msg.content === "[GENERATING_ARTIFACT]";
          const isEmptyAndLoading = msg.content === "" && loading && isLastMessage;

          // Determine if we should show the Magic Pulse Bubble
          const showMagicPulse = isGeneratingSitemap || isGeneratingPRD || isGeneratingArtifact || isEmptyAndLoading;

          // ONLY use smooth text effect if it's the latest message AND it's from the AI AND it's not a placeholder.
          const shouldAnimate = isLastMessage && isAssistant && !showMagicPulse;

          // Determine the contextual message for Magic Pulse
          let pulseMessage = "Thinking...";
          if (isGeneratingSitemap) pulseMessage = "Architecting Sitemap...";
          else if (isGeneratingPRD) pulseMessage = "Drafting Technical Spec...";
          else if (isGeneratingArtifact) pulseMessage = "Architecting...";

          // Check for gate action in assistant messages (only show in Advanced Mode or when needed)
          const gateAction = isAssistant ? parseGateAction(msg.content) : null;
          const cleanedContent = isAssistant ? cleanMessageContent(msg.content) : msg.content;
          // Show approval cards regardless of Advanced Mode, but hide gate markers in text
          const hasApproval = gateAction !== null;
          const isApprovalProcessed = processedApprovals.has(i);

          return (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-brand-primary text-text-primary shadow-lg shadow-brand-primary/20">
                    {msg.content}
                  </div>
                ) : showMagicPulse ? (
                  /* Magic Pulse Bubble for Artifact Generation */
                  <div className="max-w-[85%] bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-primary/10 border border-brand-primary/20 rounded-2xl p-5 shadow-lg animate-shimmer-glow">
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-brand-primary animate-pulse" size={18} />
                      <span className="text-sm font-medium text-brand-primary">
                        {pulseMessage}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Normal Assistant Message */
                  <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-brand-surface border border-brand-border text-text-primary shadow-sm">
                    <SmoothText
                      text={cleanedContent}
                      disabled={!shouldAnimate}
                    />
                  </div>
                )}
              </div>

              {/* Approval Card */}
              {hasApproval && !isApprovalProcessed && (
                <ApprovalCard
                  gateType={gateAction}
                  onApprove={() => handleApprove(i)}
                  onRequestChanges={handleRequestChanges}
                  disabled={loading}
                />
              )}
            </div>
          );
        })}

        {/* Thinking Animation (Shown when the user has sent a msg but stream hasn't started) */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-brand-surface border border-brand-border p-5 rounded-2xl flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 bg-brand-surface border-t border-brand-border">
        <div className="relative group">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={loading ? "AI is typing..." : "Talk to the agents..."}
            className="w-full bg-white border border-brand-border rounded-xl py-4 pl-4 pr-12 text-sm text-text-primary outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-3 text-text-primary hover:bg-brand-primary/20 rounded-lg transition-all disabled:opacity-30"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}