"use client";
import React from "react";
import { Sparkles, Database, Globe, User, Check } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { motion } from "framer-motion";

interface IntakeCardProps {
  state: WebsiteState;
  onApprove: () => void;
  loading?: boolean;
}

export default function IntakeCard({ state, onApprove, loading = false }: IntakeCardProps) {
  const inferredFields = (state.project_meta?.inferred_fields as string[]) || [];
  const crmData = state.crm_data || {};
  const researchData = (state.additional_context?.research_data as Record<string, unknown>) || {};
  const hasCrmData = Object.keys(crmData).length > 0;
  const hasResearchData = Object.keys(researchData).length > 0;

  // Determine data source for each field
  const getFieldSource = (fieldName: string): "user" | "crm" | "scraped" | "inferred" => {
    if (inferredFields.includes(fieldName)) {
      // Check if it came from CRM
      if (fieldName === "industry" && crmData.industry) return "crm";
      if (fieldName === "brand_colors" && crmData.colors) return "crm";
      // Check if it came from research
      if (researchData[fieldName]) return "scraped";
      // Otherwise it's inferred
      return "inferred";
    }
    return "user";
  };

  const fields = [
    {
      key: "project_name",
      label: "Project Name",
      value: state.project_name,
      source: getFieldSource("project_name"),
    },
    {
      key: "industry",
      label: "Industry",
      value: state.industry,
      source: getFieldSource("industry"),
    },
    {
      key: "brand_colors",
      label: "Brand Colors",
      value: Array.isArray(state.brand_colors) && state.brand_colors.length > 0
        ? state.brand_colors.join(", ")
        : state.brand_colors || "",
      source: getFieldSource("brand_colors"),
    },
    {
      key: "design_style",
      label: "Design Style",
      value: state.design_style,
      source: getFieldSource("design_style"),
    },
  ].filter((field) => field.value); // Only show fields with values

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "user":
        return <User size={12} className="text-text-secondary" />;
      case "crm":
        return <Database size={12} className="text-blue-500" />;
      case "scraped":
        return <Globe size={12} className="text-green-500" />;
      case "inferred":
        return <Sparkles size={12} className="text-brand-primary" />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "user":
        return "You provided";
      case "crm":
        return "From CRM";
      case "scraped":
        return "Scraped";
      case "inferred":
        return "AI inferred";
      default:
        return "";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "user":
        return "bg-brand-surface border-brand-border";
      case "crm":
        return "bg-blue-50 border-blue-200";
      case "scraped":
        return "bg-green-50 border-green-200";
      case "inferred":
        return "bg-brand-primary/5 border-brand-primary/20";
      default:
        return "bg-brand-surface border-brand-border";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-8 space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
          <Check className="text-brand-primary" size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-brand-primary">Project Information</h2>
          <p className="text-sm text-text-secondary mt-1">
            Review the information we've gathered about your project
          </p>
        </div>
      </div>

      {/* Data Source Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted mb-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-1.5">
          <User size={12} />
          <span>You provided</span>
        </div>
        {hasCrmData && (
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-blue-500" />
            <span>From CRM</span>
          </div>
        )}
        {hasResearchData && (
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="text-green-500" />
            <span>Scraped</span>
          </div>
        )}
        {inferredFields.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-primary" />
            <span>AI inferred</span>
          </div>
        )}
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`p-4 border rounded-xl transition-all ${getSourceColor(field.source)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase font-bold text-text-muted">{field.label}</p>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/50 rounded-full">
                {getSourceIcon(field.source)}
                <span className="text-[9px] font-semibold text-text-secondary">
                  {getSourceLabel(field.source)}
                </span>
              </div>
            </div>
            <p className="text-lg font-bold text-text-primary">{field.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Info Sections */}
      {(hasCrmData || hasResearchData) && (
        <div className="space-y-4 pt-4 border-t border-brand-border">
          {hasCrmData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-blue-600" />
                <p className="text-xs font-bold text-blue-900 uppercase">CRM Data Found</p>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                {crmData.bio && <p>• {crmData.bio as string}</p>}
                {crmData.industry && <p>• Industry: {crmData.industry as string}</p>}
                {crmData.colors && (
                  <p>• Colors: {Array.isArray(crmData.colors) ? crmData.colors.join(", ") : crmData.colors}</p>
                )}
              </div>
            </div>
          )}

          {hasResearchData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} className="text-green-600" />
                <p className="text-xs font-bold text-green-900 uppercase">Website Research</p>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                {researchData.brand_personality && (
                  <p>• Brand: {researchData.brand_personality as string}</p>
                )}
                {researchData.target_audience && (
                  <p>• Audience: {researchData.target_audience as string}</p>
                )}
                {researchData.key_services && Array.isArray(researchData.key_services) && (
                  <p>• Services: {researchData.key_services.slice(0, 3).join(", ")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Button */}
      <div className="pt-4">
        <button
          onClick={onApprove}
          disabled={loading || !state.project_name || state.missing_info.length > 0}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm
            transition-all
            ${
              loading || !state.project_name || state.missing_info.length > 0
                ? "bg-brand-primary/20 text-brand-primary/50 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
            }
          `}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Looks Good - Continue to Strategy</span>
            </>
          )}
        </button>
        {state.missing_info.length > 0 && (
          <p className="text-xs text-text-muted text-center mt-2">
            Please provide: {state.missing_info.join(", ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
