"use client";
/**
 * QuestionCard - Wrapper for intake questions (PR-07)
 *
 * Displays one question at a time with:
 * - Title and description
 * - Picker or text input
 * - "Type instead" toggle
 * - Navigation buttons
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IntakeQuestion, QuestionOption } from "../intakeQuestions";
import SingleSelectChips from "./pickers/SingleSelectChips";
import MultiSelectChips from "./pickers/MultiSelectChips";
import ColorPicker from "./pickers/ColorPicker";
import StyleChooser from "./pickers/StyleChooser";
import FontPicker from "./pickers/FontPicker";

interface QuestionCardProps {
  question: IntakeQuestion;
  currentValue: unknown;
  onSubmit: (value: unknown) => void;
  onBack?: () => void;
  showBack?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  loading?: boolean;
}

export default function QuestionCard({
  question,
  currentValue,
  onSubmit,
  onBack,
  showBack = true,
  isFirst = false,
  isLast = false,
  loading = false,
}: QuestionCardProps) {
  // Local state for the current answer
  const [value, setValue] = useState<unknown>(currentValue);
  const [isTyping, setIsTyping] = useState(false);
  const [textValue, setTextValue] = useState("");

  // Sync with external value changes
  useEffect(() => {
    setValue(currentValue);
    if (typeof currentValue === "string") {
      setTextValue(currentValue);
    } else if (Array.isArray(currentValue)) {
      setTextValue(currentValue.join(", "));
    }
  }, [currentValue]);

  // Check if we can proceed
  const canProceed = () => {
    if (!question.required) return true;
    if (isTyping) return textValue.trim().length > 0;
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const handleSubmit = () => {
    if (!canProceed()) return;

    let finalValue = value;
    if (isTyping && textValue.trim()) {
      // Use typed value
      if (question.kind === "multi" || question.kind === "pages" || question.kind === "colors") {
        // Parse comma-separated values
        finalValue = textValue.split(",").map((v) => v.trim()).filter(Boolean);
      } else {
        finalValue = textValue.trim();
      }
    }
    onSubmit(finalValue);
  };

  // Render the appropriate picker
  const renderPicker = () => {
    if (isTyping) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question.kind === "multi" || question.kind === "pages" ? (
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter values separated by commas..."
              className="w-full bg-surface-dark border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={question.placeholder || "Type your answer..."}
              className="w-full bg-surface-dark border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canProceed()) {
                  handleSubmit();
                }
              }}
            />
          )}
        </motion.div>
      );
    }

    switch (question.kind) {
      case "text":
        return (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder={question.placeholder}
            className="w-full bg-surface-dark border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple text-lg"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canProceed()) {
                handleSubmit();
              }
            }}
          />
        );

      case "single":
        return (
          <SingleSelectChips
            options={question.options || []}
            value={typeof value === "string" ? value : undefined}
            onChange={(v) => setValue(v)}
          />
        );

      case "multi":
        return (
          <MultiSelectChips
            options={question.options || []}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => setValue(v)}
          />
        );

      case "colors":
        return (
          <ColorPicker
            value={Array.isArray(value) ? value : []}
            onChange={(v) => setValue(v)}
          />
        );

      case "style":
        return (
          <StyleChooser
            options={question.options || []}
            value={typeof value === "string" ? value : undefined}
            onChange={(v) => setValue(v)}
          />
        );

      case "fonts":
        return (
          <FontPicker
            options={question.options || []}
            value={typeof value === "string" ? value : undefined}
            onChange={(v) => setValue(v)}
          />
        );

      case "pages":
        return (
          <MultiSelectChips
            options={question.options || []}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => setValue(v)}
            columns={4}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Question header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
          {question.title}
        </h2>
        {question.description && (
          <p className="text-text-secondary">{question.description}</p>
        )}
      </div>

      {/* Picker area */}
      <div className="mb-6">{renderPicker()}</div>

      {/* Type instead toggle (for non-text questions) */}
      {question.kind !== "text" && (
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setIsTyping(!isTyping)}
            className="text-sm text-accent-purple hover:underline"
          >
            {isTyping ? "Use picker instead" : "Type instead"}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        {/* Back button */}
        {showBack && !isFirst ? (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {/* Next/Submit button */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!canProceed() || loading}
          whileHover={{ scale: canProceed() && !loading ? 1.02 : 1 }}
          whileTap={{ scale: canProceed() && !loading ? 0.98 : 1 }}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all
            ${
              canProceed() && !loading
                ? "bg-accent-purple text-white hover:bg-accent-purple/90 shadow-lg shadow-accent-purple/30"
                : "bg-surface-dark text-text-muted cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </span>
          ) : isLast ? (
            "Continue"
          ) : (
            "Next"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
