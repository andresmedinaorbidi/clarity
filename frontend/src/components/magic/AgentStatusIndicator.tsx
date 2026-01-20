"use client";
import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface AgentStatusIndicatorProps {
  state: WebsiteState;
  loading: boolean;
}

// Map current_step to human-readable agent activity
function getAgentActivity(step: string, loading: boolean): string | null {
  if (!loading) return null;

  const activityMap: Record<string, string> = {
    intake: "Validating requirements...",
    research: "Researching business...",
    strategy: "Drafting strategy brief...",
    ux: "Analyzing user experience...",
    planning: "Architecting sitemap...",
    seo: "Optimizing for search...",
    copywriting: "Crafting marketing copy...",
    prd: "Drafting technical specs...",
    building: "Building website...",
  };

  return activityMap[step] || "Processing...";
}

export default function AgentStatusIndicator({ state, loading }: AgentStatusIndicatorProps) {
  const activity = getAgentActivity(state.current_step, loading);

  if (!activity) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
      <div className="relative">
        <Sparkles size={14} className="text-brand-primary animate-pulse" />
        <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping" />
      </div>
      <span className="text-xs font-bold text-brand-primary">{activity}</span>
    </div>
  );
}
