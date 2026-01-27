"use client";
/**
 * BusinessNameCard - Card for business/project name
 * Full-width header card with logo placeholder
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Check, X, Image as ImageIcon } from "lucide-react";
import { getFieldSource, getFieldValue } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import SourceBadge from "../SourceBadge";

interface BusinessNameCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function BusinessNameCard({
  state,
  onStateUpdated,
}: BusinessNameCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "project_name", true);
  const source = getFieldSource("project_name", state) as SourceType;

  useEffect(() => {
    setValue(typeof currentValue === "string" ? currentValue : "");
  }, [currentValue]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!value.trim()) return;

    setLoading(true);
    try {
      await updateProject({
        project_name: value.trim(),
        project_meta: {
          user_overrides: {
            project_name: value.trim(),
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[BusinessNameCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : "");
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6"
    >
      <div className="flex items-start gap-6">
        {/* Logo Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-400" />
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">Logo</p>
        </div>

        {/* Business Name Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {currentValue || "Your Business"}
                </h2>
                <span className="text-xs text-text-muted">*</span>
              </div>
              <p className="text-sm text-text-muted">
                Review and edit your business information
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {!isEditing && <SourceBadge source={source} />}
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-text-primary"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-red-600 disabled:opacity-50"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="p-2 rounded-lg hover:bg-green-50 transition-colors text-text-muted hover:text-green-600 disabled:opacity-50"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg
                      className="w-6 h-6 animate-spin text-brand-accent"
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
                  </div>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g., Acme Corp, Jane's Photography"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave();
                      } else if (e.key === "Escape") {
                        handleCancel();
                      }
                    }}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentValue ? (
                  <div className="text-text-primary"></div>
                ) : (
                  <p className="text-text-muted italic text-sm">Enter your business name</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
