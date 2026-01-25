"use client";
/**
 * StyleChooser - Visual design style selector (PR-07)
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption } from "../../intakeQuestions";

interface StyleChooserProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

/**
 * Style preview thumbnails with visual representations
 */
function StylePreview({ style }: { style: string }) {
  const previews: Record<string, React.ReactNode> = {
    minimal: (
      <div className="w-full h-full bg-white rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-8 bg-gray-800 rounded" />
        <div className="h-1 w-12 bg-gray-300 rounded" />
        <div className="flex-1" />
        <div className="h-2 w-6 bg-gray-800 rounded" />
      </div>
    ),
    modern: (
      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded p-2 flex flex-col gap-1">
        <div className="h-1.5 w-10 bg-white rounded" />
        <div className="h-1 w-8 bg-white/60 rounded" />
        <div className="flex-1" />
        <div className="h-2 w-8 bg-white rounded-full" />
      </div>
    ),
    elegant: (
      <div className="w-full h-full bg-stone-100 rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-10 bg-stone-800 rounded" style={{ fontFamily: "serif" }} />
        <div className="h-0.5 w-6 bg-amber-600 rounded" />
        <div className="flex-1" />
        <div className="h-1.5 w-8 bg-stone-800 rounded" />
      </div>
    ),
    playful: (
      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-yellow-300 rounded p-2 flex flex-col gap-1">
        <div className="h-2 w-8 bg-white rounded-full" />
        <div className="flex gap-1">
          <div className="h-1 w-2 bg-white/80 rounded-full" />
          <div className="h-1 w-2 bg-white/80 rounded-full" />
        </div>
        <div className="flex-1" />
        <div className="h-2 w-6 bg-white rounded-full" />
      </div>
    ),
    corporate: (
      <div className="w-full h-full bg-slate-800 rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-10 bg-blue-400 rounded" />
        <div className="h-0.5 w-8 bg-slate-400 rounded" />
        <div className="flex-1 flex gap-0.5 mt-1">
          <div className="w-3 h-3 bg-slate-600 rounded" />
          <div className="w-3 h-3 bg-slate-600 rounded" />
        </div>
        <div className="h-1.5 w-6 bg-blue-400 rounded" />
      </div>
    ),
    bold: (
      <div className="w-full h-full bg-black rounded p-2 flex flex-col gap-1">
        <div className="h-2 w-full bg-red-500 rounded" />
        <div className="h-1 w-10 bg-white rounded" />
        <div className="flex-1" />
        <div className="h-2 w-8 bg-yellow-400 rounded" />
      </div>
    ),
  };

  return (
    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-border-subtle">
      {previews[style] || previews.minimal}
    </div>
  );
}

export default function StyleChooser({
  options,
  value,
  onChange,
}: StyleChooserProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative p-3 rounded-xl text-left transition-all duration-200
              border-2
              ${
                isSelected
                  ? "border-accent-purple bg-accent-purple/10 shadow-lg shadow-accent-purple/20"
                  : "border-border-subtle bg-surface-dark/50 hover:border-border-default"
              }
            `}
          >
            {/* Selection badge */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center shadow-lg"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}

            {/* Preview */}
            <div className="mb-3">
              <StylePreview style={option.value} />
            </div>

            {/* Label */}
            <p
              className={`font-medium text-center ${
                isSelected ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {option.label}
            </p>
            {option.description && (
              <p className="text-xs text-text-muted text-center mt-1">
                {option.description}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
