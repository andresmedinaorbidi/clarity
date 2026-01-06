"use client";
import React from "react";
import { Terminal, Maximize2, RefreshCw, Code, Layout } from "lucide-react";
import ChatInterface from "./ChatInterface";

export default function BuilderSection({ state, onSend, loading }: any) {
  const lastMsg = state.chat_history[state.chat_history.length - 1];
  const isThinking = loading && lastMsg?.role === "assistant" && lastMsg.content === "";
  
  return (
    <div className="flex h-screen bg-brand-dark">
       {/* Sidebar: Unified Chat */}
      <div className="w-[380px]">
        <ChatInterface
          messages={state.chat_history}
          onSend={onSend}
          loading={loading}
          isThinking={isThinking}
        />
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col p-6 bg-brand-dark">
        <div className="bg-brand-surface border border-brand-border rounded-t-2xl p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
          </div>
          <div className="bg-brand-surface rounded-full px-4 py-1.5 text-[10px] text-text-muted font-mono border border-brand-border flex items-center gap-2">
            <Layout size={10} /> preview.ai-generator.local
          </div>
          <Maximize2 size={14} className="text-text-muted" />
        </div>
        
        <div className="flex-1 bg-white rounded-b-2xl overflow-hidden relative shadow-2xl">
          {!state.generated_code && (
            <div className="absolute inset-0 bg-brand-surface flex flex-col items-center justify-center text-center p-12">
              <Terminal className="mb-4 text-emerald-500 animate-pulse" size={32} />
              <h3 className="text-text-primary font-medium mb-2">Writing Code...</h3>
              <p className="text-text-secondary text-xs max-w-xs font-mono">Converting PRD specifications into Tailwind CSS & HTML components.</p>
            </div>
          )}
          {state.generated_code && (
            <iframe 
                srcDoc={state.generated_code}
                className="w-full h-full border-none"
                title="Website Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}