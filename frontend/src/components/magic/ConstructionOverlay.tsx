"use client";
import React from "react";
import { motion } from "framer-motion";
import { Layout, Code, Wand2 } from "lucide-react";

export default function ConstructionOverlay() {
  return (
    <div className="fixed inset-0 z-[200] bg-brand-dark flex flex-col items-center justify-center p-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full text-center space-y-8"
      >
        <div className="relative flex justify-center">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 rounded-full border border-brand-primary/20 border-t-brand-primary"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <Wand2 size={48} className="text-brand-primary animate-bounce" />
            </div>
        </div>

        <div className="space-y-2">
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter italic">Generating Code</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
                Transforming your sitemap and technical strategy into responsive Tailwind components.
            </p>
        </div>

        {/* Simulated Progress Bar */}
        <div className="w-full h-1 bg-brand-surface rounded-full overflow-hidden border border-brand-border">
            <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-full bg-brand-primary"
            />
        </div>

        <div className="grid grid-cols-3 gap-2">
            {['Vercel', 'Tailwind', 'React'].map(tech => (
                <div key={tech} className="py-2 px-3 bg-brand-surface border border-brand-border rounded-lg text-[10px] font-bold text-brand-primary uppercase">
                    {tech}
                </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}