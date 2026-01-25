"use client";
import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Building2, Palette, Type, Layout } from "lucide-react";
import ChipPicker, { ChipOption } from "./ChipPicker";
import ColorPicker from "./ColorPicker";
import FontPicker from "./FontPicker";
import StyleCard from "./StyleCard";
import { WebsiteState, ProjectMeta } from "@/hooks/use-orchestrator";
import { updateProject } from "@/lib/api";

// Industry options for chip picker
const INDUSTRY_OPTIONS: ChipOption[] = [
  { value: "technology", label: "Technology", icon: <span>💻</span> },
  { value: "healthcare", label: "Healthcare", icon: <span>🏥</span> },
  { value: "finance", label: "Finance", icon: <span>💰</span> },
  { value: "retail", label: "Retail", icon: <span>🛍️</span> },
  { value: "education", label: "Education", icon: <span>📚</span> },
  { value: "food", label: "Food & Beverage", icon: <span>🍽️</span> },
  { value: "real-estate", label: "Real Estate", icon: <span>🏠</span> },
  { value: "travel", label: "Travel", icon: <span>✈️</span> },
  { value: "fitness", label: "Fitness", icon: <span>💪</span> },
  { value: "beauty", label: "Beauty", icon: <span>💄</span> },
  { value: "legal", label: "Legal", icon: <span>⚖️</span> },
  { value: "creative", label: "Creative", icon: <span>🎨</span> },
];

interface GuidedIntakeViewProps {
  state: WebsiteState;
  onStateChange?: (newState: Partial<WebsiteState>) => void;
  loading?: boolean;
}

/**
 * Get effective value with priority: user_overrides > inferred > fallback
 */
function getEffectiveValue<T>(
  fieldName: string,
  projectMeta: ProjectMeta,
  fallback: T
): { value: T; source: "user" | "inferred" | "empty" } {
  // 1. Check user_overrides first (highest priority)
  if (projectMeta.user_overrides && fieldName in projectMeta.user_overrides) {
    return {
      value: projectMeta.user_overrides[fieldName] as T,
      source: "user",
    };
  }

  // 2. Check inferred values
  if (projectMeta.inferred && fieldName in projectMeta.inferred) {
    const inferredField = projectMeta.inferred[fieldName];
    if (inferredField && inferredField.value !== undefined && inferredField.value !== null) {
      return {
        value: inferredField.value as T,
        source: "inferred",
      };
    }
  }

  // 3. Fallback to empty/default
  return { value: fallback, source: "empty" };
}

/**
 * Get inferred value for showing AI badge (only if not overridden)
 */
function getInferredValue<T>(
  fieldName: string,
  projectMeta: ProjectMeta
): T | undefined {
  // Only return inferred if NOT in user_overrides
  if (projectMeta.user_overrides && fieldName in projectMeta.user_overrides) {
    return undefined;
  }

  if (projectMeta.inferred && fieldName in projectMeta.inferred) {
    return projectMeta.inferred[fieldName]?.value as T;
  }

  return undefined;
}

export default function GuidedIntakeView({
  state,
  onStateChange,
  loading = false,
}: GuidedIntakeViewProps) {
  const projectMeta = state.project_meta || { inferred: {}, user_overrides: {} };

  // Get effective values with data priority
  const effectiveIndustry = useMemo(
    () => getEffectiveValue<string>("industry", projectMeta, state.industry || ""),
    [projectMeta, state.industry]
  );

  const effectiveColors = useMemo(
    () => getEffectiveValue<string[]>("brand_colors", projectMeta, state.brand_colors || []),
    [projectMeta, state.brand_colors]
  );

  const effectiveStyle = useMemo(
    () => getEffectiveValue<string>("design_style", projectMeta, state.design_style || ""),
    [projectMeta, state.design_style]
  );

  const effectiveFont = useMemo(
    () => getEffectiveValue<string>("font_style", projectMeta, ""),
    [projectMeta]
  );

  // Get inferred values for AI badges
  const inferredIndustry = getInferredValue<string>("industry", projectMeta);
  const inferredColors = getInferredValue<string[]>("brand_colors", projectMeta);
  const inferredStyle = getInferredValue<string>("design_style", projectMeta);
  const inferredFont = getInferredValue<string>("font_style", projectMeta);

  /**
   * Handle field updates - calls updateProject API and updates local state
   */
  const handleFieldUpdate = useCallback(
    async (fieldName: string, value: unknown) => {
      try {
        // Optimistically update local state if callback provided
        if (onStateChange) {
          onStateChange({
            [fieldName]: value,
            project_meta: {
              ...projectMeta,
              user_overrides: {
                ...projectMeta.user_overrides,
                [fieldName]: value,
              },
            },
          });
        }

        // Call API with user_overrides flag
        const response = await updateProject({
          [fieldName]: value,
          user_overrides: [fieldName],
        });

        // Update state with server response if available
        if (response && response.state && onStateChange) {
          onStateChange(response.state);
        }
      } catch (error) {
        console.error(`[GuidedIntakeView] Failed to update ${fieldName}:`, error);
      }
    },
    [projectMeta, onStateChange]
  );

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-brand-dark">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-primary text-xs font-medium">
            <Sparkles size={14} />
            Customize Your Website
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            Let's refine the details
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Review and adjust the settings below. AI-suggested values are marked with a purple badge.
          </p>
        </motion.div>

        {/* Project Name Display */}
        {state.project_name && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-4 bg-brand-surface rounded-xl border border-brand-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-brand-primary" />
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wide">Project</div>
                <div className="text-lg font-semibold text-text-primary">
                  {state.project_name}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Industry Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Building2 size={18} />
            <h3 className="text-lg font-semibold">Industry</h3>
          </div>
          <ChipPicker
            label="What industry is your business in?"
            options={INDUSTRY_OPTIONS}
            value={effectiveIndustry.value}
            onChange={(value) => handleFieldUpdate("industry", value)}
            columns={4}
            inferredValue={inferredIndustry}
            showInferredBadge
          />
        </motion.section>

        {/* Design Style Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Layout size={18} />
            <h3 className="text-lg font-semibold">Design Style</h3>
          </div>
          <StyleCard
            label="Choose a visual style for your website"
            value={effectiveStyle.value}
            onChange={(value) => handleFieldUpdate("design_style", value)}
            inferredValue={inferredStyle}
            showInferredBadge
          />
        </motion.section>

        {/* Brand Colors Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Palette size={18} />
            <h3 className="text-lg font-semibold">Brand Colors</h3>
          </div>
          <ColorPicker
            label="Select your brand colors (up to 4)"
            value={effectiveColors.value}
            onChange={(colors) => handleFieldUpdate("brand_colors", colors)}
            maxColors={4}
            inferredValue={inferredColors}
            showInferredBadge
          />
        </motion.section>

        {/* Font Style Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-text-primary">
            <Type size={18} />
            <h3 className="text-lg font-semibold">Typography</h3>
          </div>
          <FontPicker
            label="Choose a font style"
            value={effectiveFont.value}
            onChange={(font) => handleFieldUpdate("font_style", font)}
            inferredValue={inferredFont}
            showInferredBadge
          />
        </motion.section>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex items-center gap-3 px-6 py-4 bg-brand-surface rounded-xl border border-brand-border shadow-xl">
              <Sparkles className="text-brand-primary animate-pulse" size={20} />
              <span className="text-sm font-medium text-text-primary">Updating...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
