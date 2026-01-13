"use client";
import React, { useState } from "react";
import { X, FileText, Layout, Search, PenTool, Code, ChevronRight, Target, Palette } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import SitemapTreeView from "./SitemapTreeView";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArtifactDrawerProps {
  state: WebsiteState;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "strategy" | "direction" | "ux" | "sitemap" | "seo" | "copy" | "prd" | "code";

export default function ArtifactDrawer({ state, isOpen, onClose }: ArtifactDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sitemap");

  // Determine which tabs should be enabled based on available data
  const tabs = [
    {
      id: "strategy" as TabType,
      label: "Strategy",
      icon: Target,
      enabled: state.project_meta && (state.project_meta.business_goals || state.project_meta.target_audience)
    },
    {
      id: "direction" as TabType,
      label: "Direction",
      icon: FileText,
      enabled: state.direction_snapshot && state.direction_snapshot.length > 0
    },
    {
      id: "ux" as TabType,
      label: "UX",
      icon: Palette,
      enabled: state.ux_strategy && Object.keys(state.ux_strategy).length > 0
    },
    {
      id: "sitemap" as TabType,
      label: "Sitemap",
      icon: Layout,
      enabled: state.sitemap && state.sitemap.length > 0
    },
    {
      id: "seo" as TabType,
      label: "SEO",
      icon: Search,
      enabled: state.seo_data && Object.keys(state.seo_data).length > 0
    },
    {
      id: "copy" as TabType,
      label: "Copy",
      icon: PenTool,
      enabled: state.copywriting && Object.keys(state.copywriting).length > 0
    },
    {
      id: "prd" as TabType,
      label: "PRD",
      icon: FileText,
      enabled: state.prd_document && state.prd_document.length > 0
    },
    {
      id: "code" as TabType,
      label: "Code",
      icon: Code,
      enabled: state.generated_code && state.generated_code.length > 0
    }
  ];

  // Auto-select first enabled tab
  React.useEffect(() => {
    if (isOpen) {
      const firstEnabled = tabs.find(t => t.enabled);
      if (firstEnabled) {
        setActiveTab(firstEnabled.id);
      }
    }
  }, [isOpen]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "strategy":
        return state.project_meta ? (
          <div className="p-6 space-y-6">
            {state.project_meta.business_goals && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Business Goals</h3>
                <ul className="space-y-2">
                  {state.project_meta.business_goals.map((goal: string, i: number) => (
                    <li key={i} className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary">
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {state.project_meta.target_audience && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Target Audience</h3>
                <p className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary">
                  {state.project_meta.target_audience}
                </p>
              </div>
            )}
            {state.project_meta.success_metrics && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Success Metrics</h3>
                <ul className="space-y-2">
                  {state.project_meta.success_metrics.map((metric: string, i: number) => (
                    <li key={i} className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary">
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {state.project_meta.brand_positioning && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Brand Positioning</h3>
                <p className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary">
                  {state.project_meta.brand_positioning}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No strategy data available
          </div>
        );

      case "direction":
        return state.direction_snapshot ? (
          <div className="p-6 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {state.direction_snapshot}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No direction snapshot available
          </div>
        );

      case "ux":
        return state.ux_strategy ? (
          <div className="p-6 space-y-6">
            {state.ux_strategy.primary_persona && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Primary Persona</h3>
                <div className="p-4 bg-white/60 rounded-xl border border-brand-border space-y-2">
                  <p className="text-sm font-bold text-text-primary">{state.ux_strategy.primary_persona.name}</p>
                  {state.ux_strategy.primary_persona.demographics && (
                    <p className="text-xs text-text-secondary">{state.ux_strategy.primary_persona.demographics}</p>
                  )}
                  {state.ux_strategy.primary_persona.pain_points && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mt-2">Pain Points:</p>
                      <ul className="text-xs text-text-secondary list-disc list-inside">
                        {state.ux_strategy.primary_persona.pain_points.map((pain: string, i: number) => (
                          <li key={i}>{pain}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            {state.ux_strategy.user_journey && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">User Journey</h3>
                <div className="space-y-2">
                  {state.ux_strategy.user_journey.map((stage: string, i: number) => (
                    <div key={i} className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary">
                      {stage}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {state.ux_strategy.conversion_points && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Conversion Points</h3>
                <div className="flex flex-wrap gap-2">
                  {state.ux_strategy.conversion_points.map((point: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-sm border border-brand-primary/20">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No UX strategy available
          </div>
        );

      case "sitemap":
        return state.sitemap && state.sitemap.length > 0 ? (
          <div className="p-6">
            <SitemapTreeView sitemap={state.sitemap} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No sitemap available
          </div>
        );

      case "seo":
        return state.seo_data ? (
          <div className="p-6 space-y-6">
            {/* Primary Keywords */}
            {state.seo_data.primary_keywords && state.seo_data.primary_keywords.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Primary Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {state.seo_data.primary_keywords.map((keyword: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-sm border border-brand-primary/20 font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Keywords */}
            {state.seo_data.secondary_keywords && state.seo_data.secondary_keywords.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Secondary Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {state.seo_data.secondary_keywords.map((keyword: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-text-secondary/10 text-text-secondary rounded-lg text-sm border border-text-secondary/20"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Intent */}
            {state.seo_data.search_intent && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Search Intent</h3>
                <p className="p-3 bg-white/60 rounded-lg border border-brand-border text-sm text-text-primary capitalize">
                  {state.seo_data.search_intent}
                </p>
              </div>
            )}

            {/* Page SEO */}
            {state.seo_data.page_seo && Object.keys(state.seo_data.page_seo).length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-3">Page SEO</h3>
                <div className="space-y-3">
                  {Object.entries(state.seo_data.page_seo).map(([page, seo]: [string, any]) => (
                    <div key={page} className="p-4 bg-white/60 rounded-lg border border-brand-border space-y-2">
                      <p className="text-sm font-bold text-brand-primary">{page}</p>
                      {seo.meta_title && (
                        <div>
                          <p className="text-xs font-bold text-text-muted">Meta Title</p>
                          <p className="text-sm text-text-primary">{seo.meta_title}</p>
                        </div>
                      )}
                      {seo.meta_description && (
                        <div>
                          <p className="text-xs font-bold text-text-muted">Meta Description</p>
                          <p className="text-sm text-text-secondary">{seo.meta_description}</p>
                        </div>
                      )}
                      {seo.focus_keyword && (
                        <div>
                          <p className="text-xs font-bold text-text-muted">Focus Keyword</p>
                          <span className="inline-block px-2 py-1 bg-brand-primary/10 text-brand-primary rounded text-xs">
                            {seo.focus_keyword}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No SEO data available
          </div>
        );

      case "copy":
        return state.copywriting ? (
          <div className="p-6 space-y-6">
            {/* Copy Framework & Voice */}
            {(state.copywriting.copy_framework || state.copywriting.brand_voice) && (
              <div className="flex gap-3">
                {state.copywriting.copy_framework && (
                  <div className="flex-1 p-3 bg-white/60 rounded-lg border border-brand-border">
                    <p className="text-xs font-bold text-text-muted mb-1">Framework</p>
                    <p className="text-sm text-text-primary capitalize">{state.copywriting.copy_framework}</p>
                  </div>
                )}
                {state.copywriting.brand_voice && (
                  <div className="flex-1 p-3 bg-white/60 rounded-lg border border-brand-border">
                    <p className="text-xs font-bold text-text-muted mb-1">Voice</p>
                    <p className="text-sm text-text-primary capitalize">{state.copywriting.brand_voice}</p>
                  </div>
                )}
              </div>
            )}

            {/* Page Copy */}
            {state.copywriting.page_copy && Object.entries(state.copywriting.page_copy).map(([page, content]: [string, any]) => (
              <div key={page} className="p-4 bg-white/60 rounded-xl border border-brand-border">
                <h3 className="text-lg font-bold text-brand-primary mb-4">{page}</h3>
                <div className="space-y-3">
                  {content.headline && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Headline</p>
                      <p className="text-base font-bold text-text-primary">{content.headline}</p>
                    </div>
                  )}
                  {content.subheadline && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Subheadline</p>
                      <p className="text-sm text-text-secondary">{content.subheadline}</p>
                    </div>
                  )}
                  {content.cta_primary && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Primary CTA</p>
                      <button className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold">
                        {content.cta_primary}
                      </button>
                    </div>
                  )}
                  {content.cta_secondary && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Secondary CTA</p>
                      <button className="px-4 py-2 bg-white border border-brand-border text-text-primary rounded-lg text-sm font-bold">
                        {content.cta_secondary}
                      </button>
                    </div>
                  )}
                  {content.value_props && content.value_props.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-2">Value Propositions</p>
                      <ul className="space-y-1">
                        {content.value_props.map((prop: string, i: number) => (
                          <li key={i} className="text-sm text-text-primary flex items-start">
                            <span className="text-brand-primary mr-2">•</span>
                            {prop}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No copywriting available
          </div>
        );

      case "prd":
        return state.prd_document ? (
          <div className="p-6 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {state.prd_document}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No PRD available
          </div>
        );

      case "code":
        return state.generated_code ? (
          <div className="p-6">
            <pre className="text-xs bg-black text-green-400 p-4 rounded-xl overflow-auto max-h-[600px] font-mono">
              <code>{state.generated_code}</code>
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            No code generated yet
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-[600px] bg-brand-surface shadow-2xl z-50 flex flex-col"
        style={{
          borderLeft: '1px solid rgba(96, 37, 159, 0.2)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border bg-white/60">
          <div>
            <h2 className="text-2xl font-black text-brand-primary">Artifacts</h2>
            <p className="text-xs text-text-muted mt-1">View generated content and specifications</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-border rounded-lg transition-colors"
          >
            <X className="text-text-muted" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-border bg-white/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`flex-1 py-4 px-4 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-brand-primary border-b-2 border-brand-primary bg-white/60"
                    : tab.enabled
                    ? "text-text-secondary hover:text-brand-primary hover:bg-white/40"
                    : "text-text-muted opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
}
