"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout, Code, Wand2, Check, Sparkles } from "lucide-react";

export default function ConstructionOverlay() {
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  const checklistItems = [
    { id: 0, label: "Injecting SEO Keywords & Meta Tags", icon: "🔍" },
    { id: 1, label: "Applying Marketing Copy Strategy", icon: "✍️" },
    { id: 2, label: "Implementing UX Conversion Flow", icon: "🎨" },
    { id: 3, label: "Configuring Brand Colors & Theme", icon: "🎨" },
    { id: 4, label: "Building Responsive Layout", icon: "📱" },
  ];

  useEffect(() => {
    // Sequentially check items with staggered delays
    checklistItems.forEach((_, index) => {
      setTimeout(() => {
        setCompletedItems((prev) => [...prev, index]);
      }, index * 700 + 500);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-brand-dark/98 backdrop-blur-sm flex flex-col items-center justify-center p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-brand-primary animate-pulse" size={32} />
            <h2 className="text-3xl font-black text-text-primary">Building Your Website</h2>
          </div>
          <p className="text-sm text-text-secondary">
            Transforming specialist insights into production-ready code
          </p>
        </div>

        {/* Checklist */}
        <div className="bg-brand-surface border-2 border-brand-primary/30 rounded-2xl p-8 shadow-2xl space-y-4">
          {checklistItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.id * 0.15, duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isCompleted
                    ? "bg-brand-primary/10 border-2 border-brand-primary/30"
                    : "bg-brand-dark border-2 border-brand-border"
                }`}
              >
                {/* Checkmark Circle */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-brand-primary text-white scale-110"
                      : "bg-brand-border text-text-muted"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <div className="w-3 h-3 bg-text-muted/50 rounded-full" />
                  )}
                </div>

                {/* Icon & Label */}
                <span className="text-lg" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                <span
                  className={`text-base font-semibold transition-colors ${
                    isCompleted ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted font-mono">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
            <span>Compiling production-ready HTML & Tailwind CSS...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}