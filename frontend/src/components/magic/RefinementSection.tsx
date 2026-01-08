"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Map, Info, Sparkles, Loader2, Lightbulb, Target, Users, Megaphone, Search } from "lucide-react";
import ChatInterface from "./ChatInterface";

export default function RefinementSection({ state, onSend, loading }: any) {
  const [activeTab, setActiveTab] = useState<"brief" | "insights" | "sitemap" | "marketing" | "prd">("brief");

  // Auto-tab switching with smooth transitions
  useEffect(() => {
    if (state.current_step === "strategy" || state.current_step === "ux") {
      setActiveTab("insights");
    } else if (state.current_step === "planning") {
      setActiveTab("sitemap");
    } else if (state.current_step === "seo" || state.current_step === "copywriting") {
      setActiveTab("marketing");
    } else if (state.current_step === "prd" || state.current_step === "wireframing") {
      setActiveTab("prd");
    } else if (state.current_step === "intake") {
      setActiveTab("brief");
    }
  }, [state.current_step]);

  const tabs = [
    { id: "brief", label: "Project Brief", icon: Info },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "sitemap", label: "Sitemap", icon: Map },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "prd", label: "System Specifications", icon: FileText },
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="max-w-3xl mx-auto"
            >
              {/* BRIEF TAB */}
              {activeTab === "brief" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-brand-primary">Project Context</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Project Name */}
                    <div className={`p-6 border rounded-2xl ${
                      state.project_meta?.inferred_fields?.includes("project_name")
                        ? "bg-brand-primary/5 border-brand-primary/20"
                        : "bg-brand-surface border-brand-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] uppercase font-bold text-text-muted">Project Name</p>
                        {state.project_meta?.inferred_fields?.includes("project_name") && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 rounded-full">
                            <Sparkles size={10} className="text-brand-primary" />
                            <span className="text-[8px] font-bold text-brand-primary uppercase">AI Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-bold">{state.project_name || "Defining..."}</p>
                    </div>

                    {/* Industry */}
                    <div className={`p-6 border rounded-2xl ${
                      state.project_meta?.inferred_fields?.includes("industry")
                        ? "bg-brand-primary/5 border-brand-primary/20"
                        : "bg-brand-surface border-brand-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] uppercase font-bold text-text-muted">Industry</p>
                        {state.project_meta?.inferred_fields?.includes("industry") && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 rounded-full">
                            <Sparkles size={10} className="text-brand-primary" />
                            <span className="text-[8px] font-bold text-brand-primary uppercase">AI Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-bold">{state.industry || "Analyzing..."}</p>
                    </div>

                    {/* Brand Colors */}
                    <div className={`p-6 border rounded-2xl ${
                      state.project_meta?.inferred_fields?.includes("brand_colors")
                        ? "bg-brand-primary/5 border-brand-primary/20"
                        : "bg-brand-surface border-brand-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] uppercase font-bold text-text-muted">Colors</p>
                        {state.project_meta?.inferred_fields?.includes("brand_colors") && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 rounded-full">
                            <Sparkles size={10} className="text-brand-primary" />
                            <span className="text-[8px] font-bold text-brand-primary uppercase">AI Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-bold">
                        {Array.isArray(state.brand_colors) && state.brand_colors.length > 0
                          ? state.brand_colors.join(", ")
                          : state.brand_colors || "Analyzing..."}
                      </p>
                    </div>

                    {/* Design Style */}
                    <div className={`p-6 border rounded-2xl ${
                      state.project_meta?.inferred_fields?.includes("design_style")
                        ? "bg-brand-primary/5 border-brand-primary/20"
                        : "bg-brand-surface border-brand-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] uppercase font-bold text-text-muted">Style</p>
                        {state.project_meta?.inferred_fields?.includes("design_style") && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 rounded-full">
                            <Sparkles size={10} className="text-brand-primary" />
                            <span className="text-[8px] font-bold text-brand-primary uppercase">AI Generated</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-bold">{state.design_style || "Analyzing..."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* INSIGHTS TAB */}
              {activeTab === "insights" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">Strategic Insights</h2>
                    {loading && (state.current_step === "strategy" || state.current_step === "ux") && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> AI is Analyzing...
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  {(!state.project_meta?.business_goals && !state.ux_strategy) && loading && (
                    <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                          <Lightbulb className="text-brand-primary animate-shimmer-glow" />
                        </div>
                        <p className="text-sm font-bold text-brand-primary animate-pulse">Generating Strategic Analysis...</p>
                        <div className="w-full px-20 space-y-3">
                          <div className="h-3 bg-brand-border rounded-full w-3/4 animate-pulse" />
                          <div className="h-3 bg-brand-border rounded-full w-full animate-pulse [animation-delay:0.2s]" />
                          <div className="h-3 bg-brand-border rounded-full w-1/2 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content State */}
                  {(state.project_meta?.business_goals || state.ux_strategy) && (
                    <div className="space-y-8">
                      {/* HERO CARD: Highlight Primary Goal */}
                      {(state.project_meta?.target_audience || state.project_meta?.business_goals?.[0]) && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="bg-brand-secondary/10 border-2 border-brand-secondary/30 rounded-3xl p-10"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-brand-secondary text-brand-dark flex items-center justify-center">
                              <Target className="text-brand-dark" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-brand-primary">Strategic Focus</h3>
                          </div>

                          {state.project_meta.target_audience && (
                            <div className="mb-6">
                              <p className="text-[11px] uppercase font-bold text-brand-secondary mb-3 tracking-wider">
                                Primary Target Audience
                              </p>
                              <p className="text-2xl font-black text-text-primary leading-tight">
                                {state.project_meta.target_audience}
                              </p>
                            </div>
                          )}

                          {state.project_meta.business_goals && Array.isArray(state.project_meta.business_goals) && state.project_meta.business_goals[0] && (
                            <div>
                              <p className="text-[11px] uppercase font-bold text-brand-secondary mb-3 tracking-wider">
                                Primary Business Goal
                              </p>
                              <p className="text-xl font-bold text-text-primary leading-relaxed">
                                {state.project_meta.business_goals[0]}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* FULL REPORT SECTION */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Full Strategic Report</h4>

                        {/* Business Strategy Section */}
                        {state.project_meta?.business_goals && (
                          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                <Target className="text-brand-primary" size={20} />
                              </div>
                              <h3 className="text-xl font-black text-brand-primary">Business Goals</h3>
                            </div>

                            {state.project_meta.business_goals && Array.isArray(state.project_meta.business_goals) && (
                              <div className="space-y-3">
                                {(Array.isArray(state.project_meta?.business_goals) ? state.project_meta.business_goals : []).map((goal: string, i: number) => (
                                  <div key={i} className="flex gap-3 items-start">
                                    <span className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <p className="text-text-secondary text-sm leading-relaxed">{goal}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {state.project_meta.brand_positioning && (
                              <div className="pt-4 border-t border-brand-border">
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Brand Positioning</p>
                                <p className="text-text-primary font-medium italic">{state.project_meta.brand_positioning}</p>
                              </div>
                            )}

                            {state.project_meta.success_metrics && Array.isArray(state.project_meta.success_metrics) && state.project_meta.success_metrics.length > 0 && (
                              <div className="pt-4 border-t border-brand-border">
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Success Metrics</p>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(state.project_meta?.success_metrics) ? state.project_meta.success_metrics : []).map((metric: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-full">
                                      {metric}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* UX Strategy Section */}
                        {state.ux_strategy && (
                          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                              <Users className="text-brand-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black text-brand-primary">User Experience Strategy</h3>
                          </div>

                          {/* Primary Persona */}
                          {state.ux_strategy.primary_persona && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Primary Persona</p>
                                <p className="text-lg font-bold text-brand-primary">
                                  {state.ux_strategy.primary_persona.name || "User Profile"}
                                </p>
                                {state.ux_strategy.primary_persona.demographics && (
                                  <p className="text-sm text-text-secondary mt-1">
                                    {state.ux_strategy.primary_persona.demographics}
                                  </p>
                                )}
                              </div>

                              {state.ux_strategy.primary_persona.pain_points && Array.isArray(state.ux_strategy.primary_persona.pain_points) && state.ux_strategy.primary_persona.pain_points.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Pain Points</p>
                                  <ul className="space-y-2">
                                    {(Array.isArray(state.ux_strategy?.primary_persona?.pain_points) ? state.ux_strategy.primary_persona.pain_points : []).map((pain: string, i: number) => (
                                      <li key={i} className="flex gap-2 items-start text-sm text-text-secondary">
                                        <span className="text-brand-primary mt-1">•</span>
                                        <span>{pain}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {state.ux_strategy.primary_persona.goals && Array.isArray(state.ux_strategy.primary_persona.goals) && state.ux_strategy.primary_persona.goals.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">User Goals</p>
                                  <ul className="space-y-2">
                                    {(Array.isArray(state.ux_strategy?.primary_persona?.goals) ? state.ux_strategy.primary_persona.goals : []).map((goal: string, i: number) => (
                                      <li key={i} className="flex gap-2 items-start text-sm text-text-secondary">
                                        <span className="text-brand-primary mt-1">✓</span>
                                        <span>{goal}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* User Journey */}
                          {state.ux_strategy.user_journey && Array.isArray(state.ux_strategy.user_journey) && state.ux_strategy.user_journey.length > 0 && (
                            <div className="pt-4 border-t border-brand-border">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">User Journey</p>
                              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {(Array.isArray(state.ux_strategy?.user_journey) ? state.ux_strategy.user_journey : []).map((stage: string, i: number) => (
                                  <React.Fragment key={i}>
                                    <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-lg whitespace-nowrap">
                                      {stage}
                                    </div>
                                    {i < (Array.isArray(state.ux_strategy?.user_journey) ? state.ux_strategy.user_journey.length : 0) - 1 && (
                                      <span className="text-brand-primary">→</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Conversion Points */}
                          {state.ux_strategy.conversion_points && Array.isArray(state.ux_strategy.conversion_points) && state.ux_strategy.conversion_points.length > 0 && (
                            <div className="pt-4 border-t border-brand-border">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Conversion Points</p>
                              <div className="grid grid-cols-2 gap-3">
                                {(Array.isArray(state.ux_strategy?.conversion_points) ? state.ux_strategy.conversion_points : []).map((cta: string, i: number) => (
                                  <div key={i} className="p-3 bg-brand-dark border border-brand-primary/20 rounded-lg">
                                    <p className="text-sm font-semibold text-text-primary">{cta}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* UX Priorities */}
                          {state.ux_strategy.ux_priorities && Array.isArray(state.ux_strategy.ux_priorities) && state.ux_strategy.ux_priorities.length > 0 && (
                            <div className="pt-4 border-t border-brand-border">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">UX Priorities</p>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(state.ux_strategy?.ux_priorities) ? state.ux_strategy.ux_priorities : []).map((priority: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-full">
                                    {priority}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SITEMAP TAB */}
              {activeTab === "sitemap" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">High-Fidelity Sitemap</h2>
                    {loading && state.current_step === "planning" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> AI is Architecting...
                      </div>
                    )}
                  </div>
                  <div className="grid gap-6">
                    {state.sitemap.length > 0 ? state.sitemap.map((page: any, i: number) => {
                      const isLastItem = i === state.sitemap.length - 1;
                      const isStreaming = loading && state.current_step === "planning";

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4"
                        >
                          {/* Page Header */}
                          <div className="flex items-center gap-4">
                            <span className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black text-brand-primary">{page.title || page}</h3>
                                {/* Streaming Indicator on Last Item */}
                                {isLastItem && isStreaming && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                                    <span className="text-[9px] uppercase font-bold text-brand-secondary tracking-wider">
                                      Streaming
                                    </span>
                                  </div>
                                )}
                              </div>
                              {page.purpose && (
                                <p className="text-sm text-text-secondary mt-1">{page.purpose}</p>
                              )}
                            </div>
                          </div>

                          {/* Page Sections */}
                          {page.sections && page.sections.length > 0 && (
                            <div className="pt-3 border-t border-brand-border">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Page Sections</p>
                              <div className="flex flex-wrap gap-2">
                                {page.sections.map((section: string, sIdx: number) => (
                                  <span
                                    key={sIdx}
                                    className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-lg border border-brand-primary/20"
                                  >
                                    {section}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    }) : (
                       <div className="p-20 text-center border-2 border-dashed border-brand-border rounded-3xl text-text-muted">
                         Waiting for sitemap generation...
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* MARKETING TAB */}
              {activeTab === "marketing" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">Marketing Strategy</h2>
                    {loading && (state.current_step === "seo" || state.current_step === "copywriting") && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> Drafting Content...
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  {(!state.seo_data && !state.copywriting) && loading && (
                    <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                          <Megaphone className="text-brand-primary animate-shimmer-glow" />
                        </div>
                        <p className="text-sm font-bold text-brand-primary animate-pulse">Crafting Marketing Strategy...</p>
                        <div className="w-full px-20 space-y-3">
                          <div className="h-3 bg-brand-border rounded-full w-3/4 animate-pulse" />
                          <div className="h-3 bg-brand-border rounded-full w-full animate-pulse [animation-delay:0.2s]" />
                          <div className="h-3 bg-brand-border rounded-full w-1/2 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content State */}
                  {(state.seo_data || state.copywriting) && (
                    <div className="space-y-8">
                      {/* HERO CARD: Highlight Homepage Headline */}
                      {state.copywriting?.page_copy?.Home && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="bg-brand-secondary/10 border-2 border-brand-secondary/30 rounded-3xl p-10"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-brand-secondary text-brand-dark flex items-center justify-center">
                              <Megaphone className="text-brand-dark" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-brand-primary">Homepage Hero</h3>
                          </div>

                          <div className="space-y-6">
                            {state.copywriting.page_copy.Home.headline && (
                              <div>
                                <p className="text-[11px] uppercase font-bold text-brand-secondary mb-3 tracking-wider">
                                  Primary Headline
                                </p>
                                <p className="text-3xl font-black text-text-primary leading-tight">
                                  {state.copywriting.page_copy.Home.headline}
                                </p>
                              </div>
                            )}

                            {state.copywriting.page_copy.Home.subheadline && (
                              <div>
                                <p className="text-[11px] uppercase font-bold text-brand-secondary mb-3 tracking-wider">
                                  Supporting Text
                                </p>
                                <p className="text-lg text-text-secondary leading-relaxed">
                                  {state.copywriting.page_copy.Home.subheadline}
                                </p>
                              </div>
                            )}

                            {state.copywriting.page_copy.Home.cta_primary && (
                              <div>
                                <p className="text-[11px] uppercase font-bold text-brand-secondary mb-3 tracking-wider">
                                  Call to Action
                                </p>
                                <div className="inline-block px-6 py-3 bg-brand-primary text-white font-bold rounded-lg">
                                  {state.copywriting.page_copy.Home.cta_primary}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* FULL REPORT SECTION */}
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Full Marketing Report</h4>

                        {/* SEO Section */}
                        {state.seo_data && (
                          <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                <Search className="text-brand-primary" size={20} />
                              </div>
                              <h3 className="text-xl font-black text-brand-primary">Search Engine Optimization</h3>
                            </div>

                          {/* Keywords Grid */}
                          <div className="grid grid-cols-2 gap-6">
                            {state.seo_data.primary_keywords && Array.isArray(state.seo_data.primary_keywords) && state.seo_data.primary_keywords.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Primary Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(state.seo_data?.primary_keywords) ? state.seo_data.primary_keywords : []).map((keyword: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-full">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {state.seo_data.secondary_keywords && Array.isArray(state.seo_data.secondary_keywords) && state.seo_data.secondary_keywords.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Secondary Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(state.seo_data?.secondary_keywords) ? state.seo_data.secondary_keywords : []).map((keyword: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-brand-primary/20 text-brand-primary text-xs font-semibold rounded-full">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Search Intent & Locations */}
                          {(state.seo_data.search_intent || state.seo_data.target_locations) && (
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-border">
                              {state.seo_data.search_intent && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Search Intent</p>
                                  <p className="text-sm font-semibold text-text-primary capitalize">{state.seo_data.search_intent}</p>
                                </div>
                              )}

                              {state.seo_data.target_locations && Array.isArray(state.seo_data.target_locations) && state.seo_data.target_locations.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Target Locations</p>
                                  <p className="text-sm font-semibold text-text-primary">
                                    {(Array.isArray(state.seo_data?.target_locations) ? state.seo_data.target_locations : []).join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Page SEO Details */}
                          {state.seo_data.page_seo && Object.keys(state.seo_data.page_seo).length > 0 && (
                            <div className="pt-4 border-t border-brand-border space-y-4">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Page Optimization</p>
                              {Object.entries(state.seo_data.page_seo).map(([pageName, seoData]: [string, any]) => (
                                <div key={pageName} className="p-4 bg-brand-dark border border-brand-primary/20 rounded-lg space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-brand-primary">{pageName}</h4>
                                    {seoData.focus_keyword && (
                                      <span className="px-2 py-1 bg-brand-secondary/20 text-brand-secondary text-[10px] font-bold rounded">
                                        {seoData.focus_keyword}
                                      </span>
                                    )}
                                  </div>

                                  {seoData.meta_title && (
                                    <div>
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-1">Meta Title</p>
                                      <p className="text-xs text-text-secondary">{seoData.meta_title}</p>
                                    </div>
                                  )}

                                  {seoData.meta_description && (
                                    <div>
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-1">Meta Description</p>
                                      <p className="text-xs text-text-secondary leading-relaxed">{seoData.meta_description}</p>
                                    </div>
                                  )}

                                  {seoData.h1_suggestion && (
                                    <div>
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-1">H1 Suggestion</p>
                                      <p className="text-xs font-semibold text-text-primary">{seoData.h1_suggestion}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Copywriting Section */}
                      {state.copywriting && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                              <Megaphone className="text-brand-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black text-brand-primary">Marketing Copy</h3>
                          </div>

                          {/* Framework & Voice */}
                          {(state.copywriting.copy_framework || state.copywriting.brand_voice) && (
                            <div className="grid grid-cols-2 gap-6">
                              {state.copywriting.copy_framework && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Copy Framework</p>
                                  <p className="text-sm font-semibold text-text-primary capitalize">{state.copywriting.copy_framework}</p>
                                </div>
                              )}

                              {state.copywriting.brand_voice && (
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Brand Voice</p>
                                  <p className="text-sm font-semibold text-text-primary capitalize">{state.copywriting.brand_voice}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Page Copy */}
                          {state.copywriting.page_copy && Object.keys(state.copywriting.page_copy).length > 0 && (
                            <div className="pt-4 border-t border-brand-border space-y-6">
                              <p className="text-[10px] uppercase font-bold text-text-muted mb-3">Page Content</p>
                              {Object.entries(state.copywriting.page_copy).map(([pageName, copyData]: [string, any]) => (
                                <div key={pageName} className="p-6 bg-brand-dark border border-brand-primary/20 rounded-lg space-y-4">
                                  <h4 className="text-base font-bold text-brand-primary">{pageName}</h4>

                                  {copyData.headline && (
                                    <div className="p-4 bg-brand-surface/50 rounded-lg">
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-2">Headline (H1)</p>
                                      <p className="text-lg font-black text-text-primary leading-tight">{copyData.headline}</p>
                                    </div>
                                  )}

                                  {copyData.subheadline && (
                                    <div>
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-2">Subheadline</p>
                                      <p className="text-sm text-text-secondary leading-relaxed">{copyData.subheadline}</p>
                                    </div>
                                  )}

                                  {(copyData.cta_primary || copyData.cta_secondary) && (
                                    <div className="flex gap-3">
                                      {copyData.cta_primary && (
                                        <div className="flex-1">
                                          <p className="text-[9px] uppercase font-bold text-text-muted mb-2">Primary CTA</p>
                                          <div className="px-4 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-lg text-center">
                                            {copyData.cta_primary}
                                          </div>
                                        </div>
                                      )}

                                      {copyData.cta_secondary && (
                                        <div className="flex-1">
                                          <p className="text-[9px] uppercase font-bold text-text-muted mb-2">Secondary CTA</p>
                                          <div className="px-4 py-2.5 bg-brand-primary/20 text-brand-primary text-sm font-bold rounded-lg text-center">
                                            {copyData.cta_secondary}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {copyData.value_props && Array.isArray(copyData.value_props) && copyData.value_props.length > 0 && (
                                    <div>
                                      <p className="text-[9px] uppercase font-bold text-text-muted mb-3">Value Propositions</p>
                                      <div className="space-y-2">
                                        {(Array.isArray(copyData?.value_props) ? copyData.value_props : []).map((prop: string, i: number) => (
                                          <div key={i} className="flex gap-2 items-start">
                                            <span className="text-brand-secondary mt-1 text-sm">✓</span>
                                            <span className="text-sm text-text-secondary">{prop}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SYSTEM SPECIFICATIONS TAB (PRD) */}
              {activeTab === "prd" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-brand-primary">System Specifications</h2>
                    {loading && state.current_step === "prd" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                         <Loader2 size={14} className="animate-spin" /> Auto-Generating...
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