"use client";
import React from "react";
import { ProgressEvent } from "@/hooks/use-orchestrator";
import {
  ClipboardList,
  Target,
  Lock,
  Palette,
  Layout,
  Search,
  PenTool,
  FileText,
  Rocket,
  Eye,
  LucideIcon
} from "lucide-react";

interface ProgressTimelineProps {
  events: ProgressEvent[];
  currentStep: string;
}

const PHASES: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "intake", label: "Intake", icon: ClipboardList },
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "direction_lock", label: "Direction", icon: Lock },
  { id: "ux", label: "UX", icon: Palette },
  { id: "structure_confirm", label: "Structure", icon: Layout },
  { id: "seo", label: "SEO", icon: Search },
  { id: "copywriting", label: "Copy", icon: PenTool },
  { id: "prd", label: "PRD", icon: FileText },
  { id: "building", label: "Build", icon: Rocket },
  { id: "reveal", label: "Reveal", icon: Eye },
];

export default function ProgressTimeline({ events, currentStep }: ProgressTimelineProps) {
  // Determine which phases have been completed
  const completedPhases = new Set(events.map(e => e.phase));
  const currentPhaseIndex = PHASES.findIndex(p => p.id === currentStep);

  return (
    <div className="bg-brand-surface border-b border-brand-border px-8 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {PHASES.map((phase, i) => {
          const isComplete = completedPhases.has(phase.id);
          const isCurrent = currentStep === phase.id;
          const isPast = i < currentPhaseIndex;
          const phaseEvents = events.filter(e => e.phase === phase.id);

          return (
            <React.Fragment key={phase.id}>
              {/* Phase Node */}
              <div className="flex flex-col items-center gap-2 group relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-brand-primary text-white scale-110 animate-pulse shadow-lg shadow-brand-primary/50"
                      : isComplete || isPast
                      ? "bg-brand-primary text-white"
                      : "bg-brand-dark border-2 border-brand-border text-text-muted"
                  }`}
                  title={phase.label}
                >
                  <phase.icon size={20} />
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isCurrent
                      ? "text-brand-primary"
                      : isComplete || isPast
                      ? "text-text-primary"
                      : "text-text-muted"
                  }`}
                >
                  {phase.label}
                </span>

                {/* Tooltip with events */}
                {phaseEvents.length > 0 && (
                  <div className="absolute top-full mt-2 w-64 bg-brand-dark border border-brand-border rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    <p className="text-xs font-bold text-brand-primary mb-2">{phase.label} Events</p>
                    <div className="space-y-1">
                      {phaseEvents.slice(-3).map((event, j) => (
                        <p key={j} className="text-[10px] text-text-secondary">
                          • {event.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {i < PHASES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isPast || (isComplete && i < currentPhaseIndex)
                      ? "bg-brand-primary"
                      : "bg-brand-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
