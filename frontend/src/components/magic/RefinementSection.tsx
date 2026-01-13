"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Map, Info, Sparkles, Loader2 } from "lucide-react";
import ChatInterface from "./ChatInterface";

export default function RefinementSection({ state, onSend, loading }: any) {
  const [activeTab, setActiveTab] = useState<"brief" | "sitemap" | "prd">("brief");

  useEffect(() => {
    if (state.current_step === "planning") {
      setActiveTab("sitemap");
    } else if (state.current_step === "prd" || state.current_step === "wireframing") {
      setActiveTab("prd");
    } else if (state.current_step === "intake") {
      setActiveTab("brief");
    }
  }, [state.current_step]); // This ensures that as soon as current_step changes in the hook, the tab flips.

  const tabs = [
    { id: "brief", label: "Project Brief", icon: Info },
    { id: "sitemap", label: "Sitemap", icon: Map },
    { id: "prd", label: "Strategy", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-brand-border bg-brand-surface px-8 pt-4 gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-2 ${
                  isActive ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-brand-dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              {/* BRIEF TAB */}
              {activeTab === "brief" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-brand-primary">Project Context</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Project Name</p>
                      <p className="text-xl font-bold">{state.project_name || "Defining..."}</p>
                    </div>
                    <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Industry</p>
                      <p className="text-xl font-bold">{state.industry || "Analyzing..."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SITEMAP TAB */}
              {activeTab === "sitemap" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">Sitemap</h2>
                    {loading && state.current_step === "planning" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> AI is Architecting...
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {state.sitemap.length > 0 ? state.sitemap.map((page: string, i: number) => (
                      <div key={i} className="p-5 bg-brand-surface border border-brand-border rounded-2xl flex items-center gap-4 animate-fade-in-up">
                        <span className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-mono text-xs font-bold">{i+1}</span>
                        <span className="font-bold text-text-primary">{page}</span>
                      </div>
                    )) : (
                       <div className="p-20 text-center border-2 border-dashed border-brand-border rounded-3xl text-text-muted">
                         Waiting for sitemap generation...
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* STRATEGY TAB (With Nice Loader) */}
              {activeTab === "prd" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">Technical Strategy</h2>
                    {loading && state.current_step === "prd" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                         <Loader2 size={14} className="animate-spin" /> Live Drafting...
                      </div>
                    )}
                  </div>

                  <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
                    {/* The Markdown Content */}
                    <div className={`prose prose-sm max-w-none transition-opacity duration-500 ${!state.prd_document && loading ? 'opacity-0' : 'opacity-100'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {state.prd_document}
                      </ReactMarkdown>
                    </div>

                    {/* MAGIC LOADER: Shows if document is empty and we are loading */}
                    {!state.prd_document && loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="text-brand-primary animate-shimmer-glow" />
                        </div>
                        <p className="text-sm font-bold text-brand-primary animate-pulse">Assembling Project Specifications...</p>
                        {/* Fake Skeleton Lines */}
                        <div className="w-full px-20 space-y-3">
                           <div className="h-3 bg-brand-border rounded-full w-3/4 animate-pulse" />
                           <div className="h-3 bg-brand-border rounded-full w-full animate-pulse [animation-delay:0.2s]" />
                           <div className="h-3 bg-brand-border rounded-full w-1/2 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Chat */}
      <div className="w-[450px]">
        <ChatInterface 
          messages={state.chat_history} 
          onSend={onSend} 
          loading={loading}
          isThinking={loading && state.chat_history[state.chat_history.length - 1]?.content === ""}
        />
      </div>
    </div>
  );
}