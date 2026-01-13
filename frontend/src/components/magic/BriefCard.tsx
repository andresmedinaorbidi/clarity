"use client";
import React, { useState } from "react";
import { User, Sparkles, Database, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface BriefCardProps {
  state: WebsiteState;
}

interface BriefField {
  label: string;
  value: string;
  source: "user" | "ai" | "crm" | "web";
}

export default function BriefCard({ state }: BriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Start expanded by default, check localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('briefCardExpanded');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  // Persist to localStorage when changed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('briefCardExpanded', String(isExpanded));
    }
  }, [isExpanded]);

  // Determine which fields were inferred (check if in additional_context.inferred_fields)
  const inferredFields = state.additional_context?.inferred_fields || [];

  // Build the brief fields with their sources
  const briefFields: BriefField[] = [
    {
      label: "Project Name",
      value: state.project_name || "Not specified",
      source: state.project_name ? "user" : "ai"
    },
    {
      label: "Industry",
      value: state.industry || "Not specified",
      source: inferredFields.includes("industry") ? "ai" : "user"
    },
    {
      label: "Design Style",
      value: state.design_style || "Not specified",
      source: inferredFields.includes("design_style") ? "ai" : "user"
    },
    {
      label: "Brand Colors",
      value: state.brand_colors.length > 0 ? state.brand_colors.join(", ") : "Not specified",
      source: inferredFields.includes("brand_colors") ? "ai" : "user"
    },
    {
      label: "Business Goals",
      value: state.project_meta.business_goals?.length > 0
        ? state.project_meta.business_goals.join(", ")
        : "Not yet defined",
      source: "ai"
    },
    {
      label: "Target Audience",
      value: state.project_meta.target_audience || "Not yet defined",
      source: "ai"
    }
  ];

  // Check if CRM data exists
  const hasCrmData = Object.keys(state.crm_data || {}).length > 0;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "user":
        return <User className="text-blue-500" size={14} />;
      case "ai":
        return <Sparkles className="text-brand-primary" size={14} />;
      case "crm":
        return <Database className="text-green-500" size={14} />;
      case "web":
        return <Globe className="text-cyan-500" size={14} />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "user":
        return "User-Provided";
      case "ai":
        return "AI-Inferred";
      case "crm":
        return "CRM Data";
      case "web":
        return "Web-Scraped";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div
          className="relative rounded-2xl p-8 overflow-hidden transition-all duration-300 hover:shadow-xl"
          style={{
            background: 'rgba(248, 249, 250, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(96, 37, 159, 0.2)',
            boxShadow: isExpanded
              ? '0 0 40px rgba(96, 37, 159, 0.15)'
              : '0 0 20px rgba(96, 37, 159, 0.08)'
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <User className="text-brand-primary" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-primary tracking-tight">
                    Project Brief
                  </h3>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    {briefFields.length} Fields Captured
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="text-text-muted" size={24} />
              ) : (
                <ChevronDown className="text-text-muted" size={24} />
              )}
            </div>

            {/* Preview (always visible) */}
            {!isExpanded && (
              <div className="mt-4">
                <p className="text-sm text-text-secondary">
                  {state.project_name || "Untitled Project"} • {state.industry || "Industry TBD"}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="mt-4 rounded-2xl p-6 space-y-4"
          style={{
            background: 'rgba(248, 249, 250, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(96, 37, 159, 0.1)'
          }}
        >
          {/* Data Source Legend */}
          <div className="flex flex-wrap gap-4 pb-4 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <User className="text-blue-500" size={14} />
              <span className="text-xs text-text-secondary">User-Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-brand-primary" size={14} />
              <span className="text-xs text-text-secondary">AI-Inferred</span>
            </div>
            {hasCrmData && (
              <div className="flex items-center gap-2">
                <Database className="text-green-500" size={14} />
                <span className="text-xs text-text-secondary">CRM Data</span>
              </div>
            )}
          </div>

          {/* Brief Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefFields.map((field, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/60 border border-brand-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {field.label}
                  </span>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80"
                    title={getSourceLabel(field.source)}
                  >
                    {getSourceIcon(field.source)}
                    <span className="text-[10px] font-bold text-text-secondary">
                      {getSourceLabel(field.source)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          {/* CRM Data Section (if exists) */}
          {hasCrmData && (
            <div className="pt-4 border-t border-brand-border">
              <h4 className="text-sm font-bold text-brand-primary mb-3 flex items-center gap-2">
                <Database size={16} />
                CRM Data
              </h4>
              <div className="bg-white/40 rounded-xl p-4 text-xs font-mono text-text-secondary">
                <pre>{JSON.stringify(state.crm_data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
