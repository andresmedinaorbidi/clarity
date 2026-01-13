"use client";
import React from "react";
import { Terminal, Maximize2, RefreshCw, Code, Layout } from "lucide-react";
import ChatInterface from "./ChatInterface";

interface BuilderSectionProps {
  state: any;
  onSend?: (message: string) => void;
  loading?: boolean;
  hideChat?: boolean; // New prop to hide chat when used in BuildView
}

export default function BuilderSection({ state, onSend, loading, hideChat = false }: BuilderSectionProps) {
  const lastMsg = state.chat_history[state.chat_history.length - 1];
  const isThinking = loading && lastMsg?.role === "assistant" && lastMsg.content === "";
  
  return (
<<<<<<< HEAD
    <div className={`flex ${hideChat ? 'h-full' : 'h-screen'} bg-brand-dark relative`}>
      {/* Success Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-green-400">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="text-white" size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="font-bold text-sm">Build Successful!</p>
                <p className="text-xs opacity-90">Your website is ready to preview</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar: Unified Chat - Hide if hideChat prop is true */}
      {!hideChat && onSend && (
        <div className="w-[380px]">
          <ChatInterface
            messages={state.chat_history}
            onSend={onSend}
            loading={loading}
            isThinking={isThinking}
          />
        </div>
      )}
=======
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
>>>>>>> parent of 8cede23 (Multi Agent Version with registry)

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