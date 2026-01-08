// src/components/magic/ChatInterface.tsx
"use client";
import React, { useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import SmoothText from "./SmoothText"; // <--- Add this line

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

export default function ChatInterface({ messages, onSend, loading, isThinking }: ChatInterfaceProps) {
  const [input, setInput] = React.useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-full bg-brand-surface border-l border-brand-border">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-surface">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
            Architect Assistant
          </span>
        </div>
      </div>

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

          return (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
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
                    text={msg.content}
                    disabled={!shouldAnimate}
                  />
                </div>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={loading ? "AI is typing..." : "Talk to the agents..."}
            className="w-full bg-white border border-brand-border rounded-xl py-4 pl-4 pr-12 text-sm text-text-primary outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-3 text-brand-primary hover:text-white hover:bg-brand-primary rounded-lg transition-all disabled:opacity-30"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}