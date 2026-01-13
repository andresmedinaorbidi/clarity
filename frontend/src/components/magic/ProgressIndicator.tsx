"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Target, Palette, Search, PenTool } from "lucide-react";
import { ProgressEvent } from "@/hooks/use-orchestrator";

interface ProgressIndicatorProps {
  phase: string;
  events: ProgressEvent[];
}

const PHASE_TITLES: Record<string, string> = {
  intake: "Gathering Information...",
  strategy: "Analyzing Business Goals...",
  direction_lock: "Crystallizing Direction...",
  ux: "Mapping User Journey...",
  structure_confirm: "Architecting Structure...",
  seo: "Optimizing for Search...",
  copywriting: "Crafting Copy...",
  prd: "Drafting Specifications...",
  building: "Building Website...",
  reveal: "Preparing Preview...",
};

const PHASE_ICONS: Record<string, string> = {
  intake: "📋",
  strategy: "🎯",
  direction_lock: "🔒",
  ux: "🎨",
  structure_confirm: "🏗️",
  seo: "🔍",
  copywriting: "✍️",
  prd: "📄",
  building: "🚀",
  reveal: "🎉",
};

// Agent cycling for background phases
const AGENT_SEQUENCE = [
  { name: "Strategist", icon: Target, color: "text-blue-500", phase: "strategy" },
  { name: "UX Designer", icon: Palette, color: "text-purple-500", phase: "ux" },
  { name: "SEO Specialist", icon: Search, color: "text-green-500", phase: "seo" },
  { name: "Copywriter", icon: PenTool, color: "text-pink-500", phase: "copywriting" },
];

export default function ProgressIndicator({ phase, events }: ProgressIndicatorProps) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const phaseEvents = events.filter(e => e.phase === phase);
  const latestEvent = phaseEvents[phaseEvents.length - 1];

  // Cycle through agents for background phases
  const backgroundPhases = ["strategy", "ux", "seo", "copywriting"];
  const isBackgroundPhase = backgroundPhases.includes(phase);

  useEffect(() => {
    if (isBackgroundPhase) {
      const interval = setInterval(() => {
        setCycleIndex((prev) => (prev + 1) % AGENT_SEQUENCE.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isBackgroundPhase]);

  const currentAgent = AGENT_SEQUENCE[cycleIndex];
  const AgentIcon = currentAgent.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Agent Cycling Animation for Background Phases */}
      {isBackgroundPhase ? (
        <>
          {/* Cycling Agent Avatar */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-white/60 backdrop-blur-xl border border-brand-border flex items-center justify-center shadow-xl">
              <AgentIcon className={`${currentAgent.color} transition-all duration-500`} size={64} />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-spin-slow" style={{ animationDuration: "3s" }} />
          </div>

          {/* Agent Name */}
          <h2 className="text-3xl font-black text-brand-primary mb-2 transition-all duration-500">
            {currentAgent.name}
          </h2>
          <p className="text-sm text-text-muted uppercase tracking-wider font-bold mb-6">
            Currently Working
          </p>

          {/* Latest Event */}
          {latestEvent && (
            <p className="text-lg text-text-secondary max-w-md mb-8">
              {latestEvent.message}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Standard Animated Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-brand-primary/10 flex items-center justify-center animate-pulse">
              <span className="text-6xl">{PHASE_ICONS[phase] || "⚙️"}</span>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-spin-slow" style={{ animationDuration: "3s" }} />
          </div>

          {/* Phase Title */}
          <h2 className="text-3xl font-black text-brand-primary mb-4">
            {PHASE_TITLES[phase] || "Working..."}
          </h2>

          {/* Latest Event */}
          {latestEvent && (
            <p className="text-lg text-text-secondary max-w-md mb-8">
              {latestEvent.message}
            </p>
          )}
        </>
      )}

      {/* Event Timeline */}
      {phaseEvents.length > 0 && (
        <div className="mt-8 space-y-3 max-w-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
            Progress Timeline
          </p>
          {phaseEvents.map((event, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-left p-3 bg-brand-surface/50 border border-brand-border rounded-lg"
            >
              <span className="text-brand-primary mt-0.5">•</span>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{event.message}</p>
                <p className="text-[10px] text-text-muted mt-1">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spinner for visual feedback */}
      <div className="mt-8">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    </div>
  );
}
