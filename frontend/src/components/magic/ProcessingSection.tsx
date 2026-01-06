"use client";
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Database, Search, ShieldCheck, Cpu } from "lucide-react";

export default function ProcessingSection({ state }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-dark overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        
        {/* Central Core */}
        <div className="relative mb-16">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-full border border-dashed border-brand-primary/30 flex items-center justify-center"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-3xl bg-brand-primary shadow-[0_0_30px_rgba(96,37,159,0.5)] flex items-center justify-center text-white">
                <Cpu size={32} className="animate-pulse" />
             </div>
          </div>
          
          {/* Orbiting Agents */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-40px] rounded-full border border-brand-primary/10"
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-center text-brand-primary shadow-sm">
                <Search size={14} />
             </div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-center text-brand-primary shadow-sm">
                <Database size={14} />
             </div>
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase">Initializing Engine</h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-brand-primary font-bold animate-pulse">
              {state.project_name ? `Analyzing ${state.project_name}...` : "Auditing Project Scope..."}
            </p>
            <p className="text-xs text-text-muted max-w-[200px]">
              Syncing with CRM data and auditing industry trends for your website.
            </p>
          </div>
        </div>

        {/* Mini Logs */}
        <div className="mt-12 w-full bg-brand-surface/50 border border-brand-border p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-ping" />
             <span className="text-[10px] font-bold uppercase text-text-muted">Live Trace</span>
          </div>
          <div className="space-y-1">
            {state.logs.slice(-2).map((log: string, i: number) => (
              <p key={i} className="text-[10px] font-mono text-text-secondary truncate">
                {">"} {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}