"use client";
/**
 * GuidedIntakeView - Full-screen guided intake wizard (PR-07)
 *
 * Displays one question at a time, reads inferred defaults,
 * and persists user selections to backend via /update-project.
 *
 * Priority for field values: user_overrides > inferred > state field > empty
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import QuestionCard from "./components/QuestionCard";
import {
  INTAKE_QUESTIONS,
  getFieldValue,
  type IntakeQuestion,
} from "./intakeQuestions";

interface GuidedIntakeViewProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
  onCreateWebsite: () => void;
}

/**
 * Build the payload for /update-project based on question type
 */
function buildUpdatePayload(
  question: IntakeQuestion,
  value: unknown
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Top-level fields: set both the field and user_override
  if (question.isTopLevel) {
    payload[question.field] = value;
    payload.project_meta = {
      user_overrides: {
        [question.field]: value,
      },
    };
  }
  // additional_context fields (like draft_pages)
  else if (question.isAdditionalContext) {
    payload.additional_context = {
      [question.field]: value,
    };
    payload.project_meta = {
      user_overrides: {
        [question.field]: value,
      },
    };
  }
  // Other fields: store only in user_overrides
  else {
    payload.project_meta = {
      user_overrides: {
        [question.field]: value,
      },
    };
  }

  return payload;
}

/**
 * Progress indicator component
 */
function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between text-sm text-text-muted mb-2">
        <span>
          Question {current + 1} of {total}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/**
 * Completion screen shown after all questions
 */
function CompletionScreen({
  state,
  onCreateWebsite,
  loading,
}: {
  state: WebsiteState;
  onCreateWebsite: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-lg mx-auto"
    >
      {/* Success icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-3">
        Ready to create your website
      </h2>
      <p className="text-text-secondary mb-8">
        We have everything we need to build{" "}
        <span className="text-text-primary font-medium">
          {state.project_name || "your website"}
        </span>
        .
      </p>

      {/* Summary */}
      <div className="bg-surface-dark/50 rounded-xl p-4 mb-8 text-left">
        <h3 className="text-sm font-medium text-text-muted mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Industry</span>
            <span className="text-text-primary">{state.industry || "Not set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Style</span>
            <span className="text-text-primary capitalize">{state.design_style || "Not set"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Colors</span>
            <div className="flex gap-1">
              {state.brand_colors.length > 0 ? (
                state.brand_colors.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-border-subtle"
                    style={{ backgroundColor: c }}
                  />
                ))
              ) : (
                <span className="text-text-primary">Not set</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        type="button"
        onClick={onCreateWebsite}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full sm:w-auto px-8 py-4 bg-accent-purple text-white rounded-xl font-medium text-lg hover:bg-accent-purple/90 shadow-lg shadow-accent-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
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
            Starting...
          </span>
        ) : (
          "Create Website"
        )}
      </motion.button>

      <p className="text-text-muted text-sm mt-4">
        This will start the AI generation process
      </p>
    </motion.div>
  );
}

export default function GuidedIntakeView({
  state,
  onStateUpdated,
  onCreateWebsite,
}: GuidedIntakeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const questions = INTAKE_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  // Get current value for the question
  const getCurrentValue = useCallback(() => {
    if (!currentQuestion) return undefined;
    return getFieldValue(
      state,
      currentQuestion.field,
      currentQuestion.isTopLevel,
      currentQuestion.isAdditionalContext
    );
  }, [state, currentQuestion]);

  // Handle answer submission
  const handleSubmit = async (value: unknown) => {
    if (!currentQuestion) return;

    setSaving(true);
    try {
      // Build payload and call /update-project
      const payload = buildUpdatePayload(currentQuestion, value);
      await updateProject(payload);

      // Refresh state from backend
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);

      // Move to next question or complete
      if (isLast) {
        setCompleted(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("[Intake] Failed to save:", error);
      // Still advance to not block user (state will sync eventually)
      if (isLast) {
        setCompleted(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Handle skip (for optional questions)
  const handleSkip = () => {
    if (isLast) {
      setCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-brand-dark overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-accent-purple"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-secondary">
              {state.project_name || "New Website"}
            </span>
          </div>

          {/* Skip button for optional questions */}
          {!completed && currentQuestion && !currentQuestion.required && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        {!completed && <ProgressBar current={currentIndex} total={questions.length} />}

        <AnimatePresence mode="wait">
          {completed ? (
            <CompletionScreen
              key="completion"
              state={state}
              onCreateWebsite={onCreateWebsite}
              loading={saving}
            />
          ) : currentQuestion ? (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              currentValue={getCurrentValue()}
              onSubmit={handleSubmit}
              onBack={handleBack}
              showBack={!isFirst}
              isFirst={isFirst}
              isLast={isLast}
              loading={saving}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer (optional debug info) */}
      {process.env.NODE_ENV === "development" && (
        <div className="flex-shrink-0 p-4 border-t border-border-subtle">
          <div className="max-w-2xl mx-auto">
            <details className="text-xs text-text-muted">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-2 bg-surface-dark rounded overflow-auto max-h-32">
                {JSON.stringify(
                  {
                    currentIndex,
                    field: currentQuestion?.field,
                    value: getCurrentValue(),
                    overrides: state.project_meta?.user_overrides,
                    inferred: state.project_meta?.inferred,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
