"use client";
import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, Activity, Cpu, Brain } from "lucide-react";

export default function AgentTrace({ state }: { state: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Safety: Ensure logs and agent_reasoning are always arrays
  const logs = state?.logs || [];
  const agentReasoning = state?.agent_reasoning || [];
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
          {agentReasoning.length > 0 && (
            <>
              <div className="h-4 w-px bg-brand-border" />
              <div className="flex items-center gap-2 text-text-muted text-[10px] uppercase">
                <Brain size={12} />
                <span>Thoughts: <span className="text-brand-primary font-semibold">{agentReasoning.length}</span></span>
              </div>
            </>
          )}
        </div>
        <div className="text-text-muted">
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Log Content */}
      <div className="p-6 overflow-y-auto h-52 font-mono text-[11px] space-y-2 custom-scrollbar bg-brand-dark">
        {logs.length === 0 && agentReasoning.length === 0 && (
          <p className="text-text-muted italic font-sans text-xs">Waiting for agent actions...</p>
        )}

        {/* Agent Reasoning Section */}
        {agentReasoning.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-brand-primary">
              <Brain size={12} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Agent Reasoning</span>
            </div>
            {agentReasoning.map((reasoning: any, i: number) => (
              <div key={i} className="flex gap-3 bg-brand-primary/5 border border-brand-primary/20 rounded px-3 py-2 mb-2">
                <div className="shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded text-[9px] font-bold">
                    {reasoning.agent_name}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-text-secondary text-[10px] leading-relaxed">{reasoning.thought}</p>
                </div>
                <div className="shrink-0">
                  <span className="text-brand-primary/60 text-[9px] font-semibold">
                    {Math.round(reasoning.certainty * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Logs Section */}
        {logs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-text-muted">
              <Terminal size={12} />
              <span className="text-[9px] font-bold uppercase tracking-widest">System Events</span>
            </div>
            {logs.map((log: string, i: number) => (
              <div key={i} className="flex gap-4 bg-brand-surface/30 border border-brand-border/50 rounded px-3 py-1.5 mb-2">
                <span className="text-brand-primary/40 shrink-0 text-[9px]">[{i + 1}]</span>
                <span className="text-text-secondary break-all text-[10px]">{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* Compressed Memory Section */}
        {state?.context_summary && (
          <div className="mt-4 pt-4 border-t border-brand-primary/20">
            <p className="text-brand-primary mb-2 uppercase text-[9px] font-bold">Compressed Memory:</p>
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded p-3">
              <p className="text-text-secondary text-[10px] leading-relaxed italic">
                {state.context_summary}
              </p>
            </div>
          </div>
        )}

        {/* Real-time State Preview */}
        <div className="mt-4 pt-4 border-t border-brand-primary/20">
          <p className="text-brand-primary mb-2 uppercase text-[9px] font-bold">State Snapshot:</p>
          <pre className="text-text-secondary text-[10px] bg-brand-surface p-3 rounded overflow-x-auto border border-brand-border">
            {JSON.stringify({
              missing_info: state?.missing_info || [],
              assumptions: state?.project_meta?.assumptions || [],
              sitemap_count: state?.sitemap?.length || 0,
              prd_exists: !!state?.prd_document,
              context_summary_exists: !!state?.context_summary
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}