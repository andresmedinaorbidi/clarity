"use client";
/**
 * MagicalIntakeView - Single-screen magical intake with all fields displayed as cards
 *
 * Displays all business information in a masonry card layout.
 * Each card shows auto-filled data with source badges and supports inline editing.
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import BusinessNameCard from "./components/cards/BusinessNameCard";
import IndustryCard from "./components/cards/IndustryCard";
import GoalCard from "./components/cards/GoalCard";
import StyleCard from "./components/cards/StyleCard";
import ToneCard from "./components/cards/ToneCard";
import ColorsCard from "./components/cards/ColorsCard";
import FontsCard from "./components/cards/FontsCard";
import PagesCard from "./components/cards/PagesCard";

interface MagicalIntakeViewProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
  onCreateWebsite: () => void;
}

export default function MagicalIntakeView({
  state,
  onStateUpdated,
  onCreateWebsite,
}: MagicalIntakeViewProps) {
  const [loading, setLoading] = useState(false);

  // Check if required fields are filled
  const canCreateWebsite = Boolean(
    state.project_name &&
    state.industry &&
    state.design_style &&
    state.brand_colors &&
    state.brand_colors.length > 0
  );

  const handleCreateWebsite = async () => {
    if (!canCreateWebsite || loading) return;

    setLoading(true);
    try {
      await onCreateWebsite();
    } catch (error) {
      console.error("[MagicalIntakeView] Failed to create website:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-brand-dark overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-1">
                {state.project_name || "Your Business"}
              </h1>
              <p className="text-text-secondary text-sm">
                Review and edit your business information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Masonry grid */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Masonry grid layout - responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {/* Business Name Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <BusinessNameCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Industry Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <IndustryCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Goal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GoalCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Style Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StyleCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Tone Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ToneCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Colors Card - Spans 2 columns on larger screens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
            >
              <ColorsCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Fonts Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FontsCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Pages Card - Spans 2 columns on larger screens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
            >
              <PagesCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer with Create Website button */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-t border-brand-border bg-brand-surface/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              {canCreateWebsite ? (
                <span>Ready to create your website</span>
              ) : (
                <span>Please fill in all required fields</span>
              )}
            </div>
            <motion.button
              type="button"
              onClick={handleCreateWebsite}
              disabled={!canCreateWebsite || loading}
              whileHover={{ scale: canCreateWebsite && !loading ? 1.02 : 1 }}
              whileTap={{ scale: canCreateWebsite && !loading ? 0.98 : 1 }}
              className="btn-primary px-8 py-3 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </div>
  );
}
