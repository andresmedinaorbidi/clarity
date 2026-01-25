"use client";
/**
 * SingleSelectChips - Radio-style chip selector (PR-07)
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption } from "../../intakeQuestions";

interface SingleSelectChipsProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}

export default function SingleSelectChips({
  options,
  value,
  onChange,
  columns = 2,
}: SingleSelectChipsProps) {
  return (
    <div
      className={`grid gap-3 ${
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
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
              relative p-4 rounded-xl text-left transition-all duration-200
              border-2
              ${
                isSelected
                  ? "border-accent-purple bg-accent-purple/10 shadow-lg shadow-accent-purple/20"
                  : "border-border-subtle bg-surface-dark/50 hover:border-border-default hover:bg-surface-dark"
              }
            `}
          >
            {/* Selection indicator */}
            <div className="absolute top-3 right-3">
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${
                    isSelected
                      ? "border-accent-purple bg-accent-purple"
                      : "border-text-muted"
                  }
                `}
              >
                {isSelected && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
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
                  </motion.svg>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pr-8">
              <p
                className={`font-medium ${
                  isSelected ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {option.label}
              </p>
              {option.description && (
                <p className="text-sm text-text-muted mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
