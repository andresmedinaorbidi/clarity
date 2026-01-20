"use client";
import React from "react";
import { Sparkles, Settings } from "lucide-react";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";
import { motion } from "framer-motion";

export default function AdvancedModeToggle() {
  const { isAdvancedMode, toggleAdvancedMode } = useAdvancedMode();

  return (
    <button
      onClick={toggleAdvancedMode}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface hover:bg-brand-dark transition-all group"
      title={isAdvancedMode ? "Disable Advanced Mode" : "Enable Advanced Mode"}
    >
      {isAdvancedMode ? (
        <Settings size={14} className="text-brand-primary" />
      ) : (
        <Sparkles size={14} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
      )}
      <span className={`text-xs font-bold transition-colors ${
        isAdvancedMode ? "text-brand-primary" : "text-text-secondary group-hover:text-text-primary"
      }`}>
        {isAdvancedMode ? "Advanced" : "Simple"}
      </span>
      {/* Toggle Switch */}
      <div className={`relative w-8 h-4 rounded-full transition-all ${
        isAdvancedMode ? "bg-brand-primary" : "bg-brand-border"
      }`}>
        <motion.div
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
          animate={{
            x: isAdvancedMode ? 16 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </div>
    </button>
  );
}
