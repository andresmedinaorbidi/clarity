"use client";
/**
 * FontPicker - Typography pairing selector (PR-07, PR-07.1)
 *
 * PR-07.1 Updates:
 * - Accepts priorityMeta for displaying "Recommended" / "From your description" badges
 * - Uses brand accent for priority highlighting
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption, PriorityOptionMeta } from "../../intakeQuestions";

interface FontPickerProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  priorityMeta?: PriorityOptionMeta[];
}

/**
 * Font preview with heading and body text sample
 */
function FontPreview({ fontPair }: { fontPair: string }) {
  // Map font pair values to display names
  const fontMap: Record<string, { heading: string; body: string }> = {
    inter_playfair: { heading: "Playfair Display", body: "Inter" },
    poppins_lora: { heading: "Lora", body: "Poppins" },
    roboto_roboto_slab: { heading: "Roboto Slab", body: "Roboto" },
    montserrat_merriweather: { heading: "Montserrat", body: "Merriweather" },
    open_sans_oswald: { heading: "Oswald", body: "Open Sans" },
    system: { heading: "System UI", body: "System UI" },
  };

  const fonts = fontMap[fontPair] || fontMap.system;

  return (
    <div className="p-3 bg-white rounded-lg">
      <p
        className="text-lg font-bold text-gray-900 mb-1"
        style={{ fontFamily: `${fonts.heading}, serif` }}
      >
        Heading
      </p>
      <p
        className="text-sm text-gray-600"
        style={{ fontFamily: `${fonts.body}, sans-serif` }}
      >
        Body text sample
      </p>
    </div>
  );
}

export default function FontPicker({
  options,
  value,
  onChange,
  priorityMeta,
}: FontPickerProps) {
  // PR-07.1: Helper to find priority info for an option
  const getPriorityInfo = (optionValue: string) => {
    return priorityMeta?.find(
      (m) => m.value.toLowerCase() === optionValue.toLowerCase()
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => {
        const isSelected = value?.toLowerCase() === option.value.toLowerCase();
        const priorityInfo = getPriorityInfo(option.value);
        const isPriority = !!priorityInfo;

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-3 rounded-xl text-left transition-all duration-200
              border-2
              ${
                isSelected
                  ? "border-brand-accent bg-brand-accent/10 shadow-lg"
                  : isPriority
                  ? "border-brand-accent/30 bg-brand-surface hover:border-brand-accent/50"
                  : "border-brand-border bg-brand-surface hover:border-text-muted"
              }
            `}
          >
            {/* PR-07.1: Priority badge */}
            {priorityInfo && (
              <div className="absolute -top-2 left-2 z-10">
                <span
                  className={
                    priorityInfo.type === "user" ? "badge-user" : "badge-ai"
                  }
                >
                  {priorityInfo.type === "inferred" && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {priorityInfo.label}
                </span>
              </div>
            )}

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-brand-accent rounded-full flex items-center justify-center z-10"
              >
                <svg
                  className="w-3 h-3 text-white"
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
            <div className="mb-2 mt-1">
              <FontPreview fontPair={option.value} />
            </div>

            {/* Label */}
            <p
              className={`font-medium text-sm ${
                isSelected ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {option.label}
            </p>
            {option.description && (
              <p className="text-xs text-text-muted mt-0.5">
                {option.description}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
