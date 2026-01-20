"use client";
import React, { useState, useEffect } from "react";
import { Terminal, Maximize2, RefreshCw, Code, Layout, Check, Sparkles } from "lucide-react";
import ChatInterface from "./ChatInterface";
import { AnimatePresence, motion } from "framer-motion";

export default function BuilderSection({ state, onSend, loading }: any) {
  const lastMsg = state.chat_history[state.chat_history.length - 1];
  const isThinking = loading && lastMsg?.role === "assistant" && lastMsg.content === "";

  // Magic Checklist state
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  // Success notification state
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const checklistItems = [
    { id: 0, label: "Injecting SEO Keywords", icon: "🔍" },
    { id: 1, label: "Applying Copywriting Strategy", icon: "✍️" },
    { id: 2, label: "Implementing UX Flow", icon: "🎨" },
    { id: 3, label: "Configuring Brand Colors", icon: "🎨" },
    { id: 4, label: "Building Responsive Layout", icon: "📱" },
  ];

  // Show checklist when building starts
  useEffect(() => {
    if (state.current_step === "building" && loading && !state.generated_code) {
      setChecklistVisible(true);
      setCompletedItems([]);

      // Sequentially check items
      checklistItems.forEach((_, index) => {
        setTimeout(() => {
          setCompletedItems((prev) => [...prev, index]);
        }, index * 600 + 400);
      });
    }

    // Hide checklist once code starts streaming
    if (state.generated_code) {
      setTimeout(() => setChecklistVisible(false), 300);
    }
  }, [state.current_step, loading, state.generated_code]);

  // Show success toast when builder loads with code
  useEffect(() => {
    if (state.generated_code && state.generated_code.length > 0) {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.generated_code]);

  return (
    <div className="flex h-screen bg-brand-dark relative">
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

          {/* Magic Checklist Overlay */}
          <AnimatePresence>
            {checklistVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-brand-dark/95 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-brand-surface border-2 border-brand-primary/30 rounded-2xl p-8 shadow-2xl max-w-md w-full"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-brand-primary animate-pulse" size={24} />
                    <h3 className="text-lg font-bold text-text-primary">Building Your Website</h3>
                  </div>

                  <div className="space-y-3">
                    {checklistItems.map((item) => {
                      const isCompleted = completedItems.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: item.id * 0.15 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isCompleted
                              ? "bg-brand-primary/10 border border-brand-primary/30"
                              : "bg-brand-surface border border-brand-border"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                              isCompleted
                                ? "bg-brand-primary text-text-primary scale-110"
                                : "bg-brand-border text-text-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <Check size={14} strokeWidth={3} />
                            ) : (
                              <div className="w-2 h-2 bg-text-muted/50 rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-mono mr-2">{item.icon}</span>
                          <span
                            className={`text-sm font-medium transition-colors ${
                              isCompleted ? "text-text-primary" : "text-text-muted"
                            }`}
                          >
                            {item.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-brand-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                      <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                      <span>Compiling production-ready code...</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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