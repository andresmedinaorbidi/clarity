"use client";
/**
 * FontPicker - Typography pairing selector (PR-07)
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption } from "../../intakeQuestions";

interface FontPickerProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
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
}: FontPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;
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
                  ? "border-accent-purple bg-accent-purple/10 shadow-lg shadow-accent-purple/20"
                  : "border-border-subtle bg-surface-dark/50 hover:border-border-default"
              }
            `}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-accent-purple rounded-full flex items-center justify-center"
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
            <div className="mb-2">
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
