"use client";
/**
 * MultiSelectChips - Checkbox-style chip selector (PR-07)
 */

import React from "react";
import { motion } from "framer-motion";
import type { QuestionOption } from "../../intakeQuestions";

interface MultiSelectChipsProps {
  options: QuestionOption[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: 2 | 3 | 4;
  maxSelections?: number;
}

export default function MultiSelectChips({
  options,
  value,
  onChange,
  columns = 3,
  maxSelections,
}: MultiSelectChipsProps) {
  const handleToggle = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        // Replace oldest selection
        onChange([...value.slice(1), optionValue]);
      } else {
        onChange([...value, optionValue]);
      }
    }
  };

  const getGridCols = () => {
    switch (columns) {
      case 4:
        return "grid-cols-2 sm:grid-cols-4";
      case 3:
        return "grid-cols-2 sm:grid-cols-3";
      default:
        return "grid-cols-1 sm:grid-cols-2";
    }
  };

  return (
    <div className={`grid gap-2 ${getGridCols()}`}>
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-3 rounded-lg text-left transition-all duration-200
              border
              ${
                isSelected
                  ? "border-accent-purple bg-accent-purple/10"
                  : "border-border-subtle bg-surface-dark/50 hover:border-border-default"
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <div
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
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

              {/* Label */}
              <div className="min-w-0">
                <p
                  className={`font-medium text-sm truncate ${
                    isSelected ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {option.label}
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
