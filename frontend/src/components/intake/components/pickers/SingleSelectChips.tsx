"use client";
/**
 * SingleSelectChips - Radio-style chip selector (PR-07, PR-07.1)
 *
 * PR-07.1 Updates:
 * - Accepts priorityMeta for displaying "Recommended" / "From your description" badges
 * - Uses brand accent for priority highlighting
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption, PriorityOptionMeta } from "../../intakeQuestions";

interface SingleSelectChipsProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  columns?: 2 | 3;
  priorityMeta?: PriorityOptionMeta[];
}

export default function SingleSelectChips({
  options,
  value,
  onChange,
  columns = 2,
  priorityMeta,
}: SingleSelectChipsProps) {
  // PR-07.1: Helper to find priority info for an option
  const getPriorityInfo = (optionValue: string) => {
    return priorityMeta?.find(
      (m) => m.value.toLowerCase() === optionValue.toLowerCase()
    );
  };

  return (
    <div
      className={`grid gap-3 ${
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
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
              relative p-4 rounded-xl text-left transition-all duration-200
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
              <div className="absolute -top-2 left-3">
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
            <div className="absolute top-3 right-3">
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${
                    isSelected
                      ? "border-brand-accent bg-brand-accent"
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
            <div className="pr-8 pt-1">
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
