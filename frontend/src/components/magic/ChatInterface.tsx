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
  state?: any; // Optional state for contextual hints
}

const THINKING_PHRASES = [
  "Analyzing your request...",
  "Consulting agents...",
  "Synthesizing insights...",
  "Crafting response...",
];

export default function ChatInterface({ messages, onSend, loading, isThinking, state }: ChatInterfaceProps) {
  const [input, setInput] = React.useState("");
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = React.useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle through thinking phrases
  useEffect(() => {
    if (isThinking || loading) {
      const interval = setInterval(() => {
        setThinkingPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isThinking, loading]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input);
      setInput("");
      // Keep focus in input after sending
      setTimeout(() => inputRef.current?.focus(), 50);
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
        {/* Contextual Hint for Direction Lock (GATE A) */}
        {state?.current_step === "direction_lock" && state?.direction_snapshot && (
          <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
            <p className="text-xs text-brand-primary font-bold mb-2 uppercase tracking-wider">
              🎯 Direction Snapshot
            </p>
            <div className="text-sm text-text-primary whitespace-pre-line">
              {state.direction_snapshot}
            </div>
          </div>
        )}

        {/* Contextual Hint for Structure Confirm (GATE B) */}
        {state?.current_step === "structure_confirm" && state?.sitemap && state.sitemap.length > 0 && (
          <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
            <p className="text-xs text-brand-primary font-bold mb-2 uppercase tracking-wider">
              🏗️ Structure Ready
            </p>
            <p className="text-sm text-text-primary">
              {state.sitemap.length} pages designed. Review structure on the left.
            </p>
          </div>
        )}

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
                /* Magic Pulse Bubble for Artifact Generation with Shimmer */
                <div
                  className="max-w-[85%] border border-brand-primary/20 rounded-2xl p-5 shadow-lg relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, rgba(96, 37, 159, 0.05), rgba(96, 37, 159, 0.15), rgba(96, 37, 159, 0.05))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite'
                  }}
                >
                  <div className="flex items-center gap-3 relative z-10">
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

        {/* Claude-Style Thinking Animation with Cycling Phrases */}
        {isThinking && (
          <div className="flex justify-start">
            <div
              className="border border-brand-primary/20 p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, rgba(96, 37, 159, 0.05), rgba(96, 37, 159, 0.15), rgba(96, 37, 159, 0.05))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
                </div>
                <span className="text-sm font-medium text-brand-primary">
                  {THINKING_PHRASES[thinkingPhraseIndex]}
                </span>
              </div>
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
            autoFocus
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