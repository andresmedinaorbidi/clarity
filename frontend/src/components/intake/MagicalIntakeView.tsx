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
    <div className="h-full flex flex-col bg-premium overflow-y-auto relative">
      {/* Main content - Two column layout */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Two column grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Business Name Card - Full width at top */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="lg:col-span-2"
            >
              <BusinessNameCard
                state={state}
                onStateUpdated={onStateUpdated}
              />
            </motion.div>

            {/* Left Column: Brand Identity */}
            <div className="space-y-6 lg:space-y-8">
              {/* Brand Colors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ColorsCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>

              {/* Typography */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <FontsCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>

              {/* Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StyleCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>
            </div>

            {/* Right Column: Business Details */}
            <div className="space-y-6 lg:space-y-8">
              {/* Industry */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <IndustryCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>

              {/* Goal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <GoalCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>

              {/* Brand Tone */}
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

              {/* Pages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <PagesCard
                  state={state}
                  onStateUpdated={onStateUpdated}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Create Website button */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-t border-brand-border bg-white/80 backdrop-blur-sm sticky bottom-0 z-10">
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
