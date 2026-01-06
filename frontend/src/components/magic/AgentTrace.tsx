"use client";
import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, Activity, Cpu } from "lucide-react";

export default function AgentTrace({ state }: { state: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Safety: Ensure logs is always an array
  const logs = state?.logs || [];
  const currentStep = state?.current_step || "unknown";

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-brand-surface/95 border-t border-brand-border transition-all duration-300 z-[100] backdrop-blur-sm ${isOpen ? 'h-64' : 'h-10'}`}>
      {/* Header / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-6 flex items-center justify-between cursor-pointer hover:bg-brand-border/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-brand-primary">
            <Activity size={14} className={logs.length > 0 ? "animate-pulse" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Agent Logic Trace</span>
          </div>
          <div className="h-4 w-px bg-brand-border" />
          <div className="flex items-center gap-2 text-text-muted text-[10px] uppercase">
            <Cpu size={12} />
            <span>Active Step: <span className="text-text-primary font-semibold">{currentStep}</span></span>
          </div>
        </div>
        <div className="text-text-muted">
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Log Content */}
      <div className="p-6 overflow-y-auto h-52 font-mono text-[11px] space-y-2 custom-scrollbar bg-brand-dark">
        {logs.length === 0 && <p className="text-text-muted italic font-sans text-xs">Waiting for agent actions...</p>}
        {logs.map((log: string, i: number) => (
          <div key={i} className="flex gap-4 border-b border-brand-border pb-2">
            <span className="text-brand-primary/60 shrink-0">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
            <span className="text-text-secondary break-all">{log}</span>
          </div>
        ))}

        {/* Real-time State Preview */}
        <div className="mt-4 pt-4 border-t border-brand-primary/20">
          <p className="text-brand-primary mb-2 uppercase text-[9px] font-bold">State Snapshot:</p>
          <pre className="text-text-secondary text-[10px] bg-brand-surface p-3 rounded overflow-x-auto border border-brand-border">
            {JSON.stringify({
              missing_info: state?.missing_info || [],
              sitemap_count: state?.sitemap?.length || 0,
              prd_exists: !!state?.prd_document
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}