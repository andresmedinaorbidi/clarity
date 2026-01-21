"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, Users, MessageSquare, FileText, Sparkles, Map, Check } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";
import VisualSitemap from "./VisualSitemap";

interface BlueprintScreenProps {
  state: WebsiteState;
  onApprove?: () => void;
  loading?: boolean;
}

// Parse brief to extract key information (from VisualBrief)
function parseBrief(brief: string) {
  const sections: Record<string, string> = {};

  // Extract Core Promise
  const promiseMatch = brief.match(/###\s*Core Promise\s*\n([\s\S]*?)(?=\n\n|\n###|##|$)/i);
  if (promiseMatch) {
    sections.corePromise = promiseMatch[1].trim().replace(/^\*\*|\*\*$/g, "").replace(/^\[|\]$/g, "");
  }

  // Extract Business Goals
  const goalsMatch = brief.match(/##\s*Business Goals\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (goalsMatch) {
    sections.businessGoals = goalsMatch[1].trim();
  }

  // Extract Primary Objectives
  const objectivesMatch = brief.match(/###\s*Primary Objectives\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (objectivesMatch) {
    sections.primaryObjectives = objectivesMatch[1].trim();
  }

  // Extract Demographics
  const demoMatch = brief.match(/\*\*Demographics:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (demoMatch) {
    sections.demographics = demoMatch[1].trim();
  }

  // Extract Psychographics
  const psychoMatch = brief.match(/\*\*Psychographics:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (psychoMatch) {
    sections.psychographics = psychoMatch[1].trim();
  }

  // Extract Primary Trait
  const primaryTraitMatch = brief.match(/\*\*Primary Trait:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (primaryTraitMatch) {
    sections.primaryTrait = primaryTraitMatch[1].trim();
  }

  // Extract Secondary Trait
  const secondaryTraitMatch = brief.match(/\*\*Secondary Trait:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (secondaryTraitMatch) {
    sections.secondaryTrait = secondaryTraitMatch[1].trim();
  }

  // Extract Communication Style
  const commStyleMatch = brief.match(/\*\*Communication Style:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (commStyleMatch) {
    sections.communicationStyle = commStyleMatch[1].trim();
  }

  return sections;
}

// Sanitize text
function sanitizeText(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\{[^{}]*"([^"]+)":\s*"([^"]+)"[^{}]*\}/g, "");
  cleaned = cleaned.replace(/\["([^"]+)",\s*"([^"]+)"[^\]]*\]/g, "");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`[^`]+`/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

// Extract from text
function extractFromText(text: string | undefined, key: string): string | null {
  if (!text) return null;
  const match = new RegExp(`${key}[:\-]\\s*([^\\n]+)`, "i").exec(text);
  if (!match) return null;
  return sanitizeText(match[1]);
}

export default function BlueprintScreen({ state, onApprove, loading = false }: BlueprintScreenProps) {
  const { isAdvancedMode } = useAdvancedMode();
  const parsed = useMemo(() => parseBrief(state.project_brief || ""), [state.project_brief]);

  // Primary Goal - from business goals or primary objectives
  const primaryGoal = useMemo(() => {
    if (parsed.primaryObjectives) {
      const firstGoal = parsed.primaryObjectives.split("\n")[0]?.replace(/^\d+\.\s*/, "").trim();
      if (firstGoal) return sanitizeText(firstGoal);
    }
    if (parsed.businessGoals) {
      const firstGoal = parsed.businessGoals.split("\n")[0]?.replace(/^\d+\.\s*/, "").trim();
      if (firstGoal) return sanitizeText(firstGoal);
    }
    const goals = state.project_meta?.business_goals;
    if (Array.isArray(goals) && goals.length > 0) {
      return String(goals[0]);
    }
    if (typeof goals === "string") {
      return goals.split("\n")[0]?.trim() || goals;
    }
    return "Build a powerful digital presence";
  }, [parsed, state.project_meta]);

  // Target Audience - demographics + psychographics
  const targetAudienceMeta = state.project_meta?.target_audience as string;
  const demographics = parsed.demographics || extractFromText(targetAudienceMeta, "Demographics") || "To be defined";
  const psychographics = parsed.psychographics || extractFromText(targetAudienceMeta, "Psychographics") || "Quality-focused customers";

  // Core Message - Core Promise or Value Proposition
  const coreMessage = parsed.corePromise ||
    (state.project_meta?.value_proposition as string) ||
    "Delivering exceptional value to our customers";

  // Tone and Style
  const brandVoiceMeta = state.project_meta?.brand_voice as string;
  const primaryTrait = parsed.primaryTrait || extractFromText(brandVoiceMeta, "Primary Trait") || "Professional";
  const secondaryTrait = parsed.secondaryTrait || extractFromText(brandVoiceMeta, "Secondary Trait") || "Approachable";
  const communicationStyle = parsed.communicationStyle || extractFromText(brandVoiceMeta, "Communication Style") || "Clear and confident";

  // Pages list
  const sitemap = state.sitemap || [];

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Target className="text-brand-secondary" size={18} />
          </div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
            Website Blueprint
          </h2>
        </div>
        <div className="border-t border-brand-border pt-6">
          <p className="text-sm font-normal text-text-secondary leading-relaxed max-w-2xl">
            Here's what your website will do and how it will connect with your audience:
          </p>
        </div>
      </motion.div>

      {/* Primary Goal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Target className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Primary Goal</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          <p className="text-base font-normal text-text-primary leading-relaxed">{primaryGoal}</p>
        </div>
      </motion.div>

      {/* Target Audience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Users className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Target Audience</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Demographics</p>
              <p className="text-sm font-normal text-text-primary">{demographics}</p>
            </div>
            <div className="pt-3 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Psychographics</p>
              <p className="text-sm font-normal text-text-secondary">{psychographics}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Core Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <MessageSquare className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Core Message</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          <p className="text-base font-normal text-text-primary leading-relaxed">{coreMessage}</p>
        </div>
      </motion.div>

      {/* Pages List */}
      {sitemap.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <FileText className="text-brand-secondary" size={18} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">
              Pages <span className="text-brand-secondary">({sitemap.length} {sitemap.length === 1 ? "page" : "pages"})</span>
            </h3>
          </div>
          <div className="border-t border-brand-border pt-6">
            <div className="space-y-3">
              {sitemap.map((page, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 border border-brand-border rounded-lg hover:border-brand-primary/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{page.title}</p>
                    {page.purpose && (
                      <p className="text-xs text-text-secondary mt-1">{page.purpose}</p>
                    )}
                    {page.sections && page.sections.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-text-muted">{page.sections.length} sections</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tone and Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Sparkles className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Tone and Style</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Primary</p>
              <p className="text-sm font-normal text-text-primary">{primaryTrait}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Secondary</p>
              <p className="text-sm font-normal text-text-secondary">{secondaryTrait}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Communication</p>
              <p className="text-sm font-normal text-text-secondary">{communicationStyle}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Mode: Full Sitemap Mockup */}
      {isAdvancedMode && sitemap.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-8 border-t border-brand-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Map className="text-brand-primary" size={20} />
            <h3 className="text-sm font-medium text-text-primary">Interactive Sitemap Preview</h3>
          </div>
          <VisualSitemap state={state} />
        </motion.div>
      )}

      {/* Approval Button */}
      {onApprove && (state.project_brief || state.sitemap?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4"
        >
          <button
            onClick={onApprove}
            disabled={loading || !state.project_brief || !state.sitemap?.length}
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm
              transition-all
              ${
                loading || !state.project_brief || !state.sitemap?.length
                  ? "bg-brand-primary/20 text-brand-primary/50 cursor-not-allowed"
                  : "bg-text-primary hover:bg-text-primary/90 text-white shadow-md hover:shadow-lg"
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
                <span>Looks Good - Start Building</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
