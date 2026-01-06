// src/components/magic/HeroSection.tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onStart: (input: string) => void;
  loading: boolean;
}

export default function HeroSection({ onStart, loading }: HeroSectionProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onStart(input);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-brand-dark">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-primary text-xs font-medium mb-4"
          >
            <Sparkles size={14} />
            Teo tu asistente virtual 
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text-primary">
            ¿Qué quieres <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              construir hoy?
            </span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Describe your business, industry, or idea. I'll handle the research,
            briefing, and the build.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="i.e. A luxury watch brand called 'Chronos'..."
            className="w-full bg-white border border-brand-border rounded-2xl py-6 px-8 text-xl text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all placeholder:text-text-muted shadow-xl"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-3 top-3 bottom-3 px-6 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border disabled:text-text-muted text-white rounded-xl font-medium transition-all flex items-center gap-2 group"
          >
            {loading ? "Thinking..." : "Generate"}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-3">
          {["Restaurant", "SaaS Startup", "Portfolio", "Real Estate"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(`A modern website for a ${suggestion} called...`)}
              className="text-xs text-text-secondary hover:text-brand-primary px-3 py-1.5 rounded-full border border-brand-border hover:border-brand-primary/50 bg-brand-surface transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}