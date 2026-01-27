"use client";
/**
 * StyleCard - Card for design style selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, STYLE_OPTIONS, buildPriorityOptions } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import StyleChooser from "../pickers/StyleChooser";
import { Palette } from "lucide-react";
import { getFieldVisuals, renderCustomFieldDisplay } from "../visualHelpers";

/**
 * Style preview thumbnails with visual representations
 */
function StylePreview({ style }: { style: string }) {
  const previews: Record<string, React.ReactNode> = {
    minimal: (
      <div className="w-full h-full bg-white rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-8 bg-gray-800 rounded" />
        <div className="h-1 w-12 bg-gray-300 rounded" />
        <div className="flex-1" />
        <div className="h-2 w-6 bg-gray-800 rounded" />
      </div>
    ),
    modern: (
      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded p-2 flex flex-col gap-1">
        <div className="h-1.5 w-10 bg-white rounded" />
        <div className="h-1 w-8 bg-white/60 rounded" />
        <div className="flex-1" />
        <div className="h-2 w-8 bg-white rounded-full" />
      </div>
    ),
    elegant: (
      <div className="w-full h-full bg-stone-100 rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-10 bg-stone-800 rounded" style={{ fontFamily: "serif" }} />
        <div className="h-0.5 w-6 bg-amber-600 rounded" />
        <div className="flex-1" />
        <div className="h-1.5 w-8 bg-stone-800 rounded" />
      </div>
    ),
    playful: (
      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-yellow-300 rounded p-2 flex flex-col gap-1">
        <div className="h-2 w-8 bg-white rounded-full" />
        <div className="flex gap-1">
          <div className="h-1 w-2 bg-white/80 rounded-full" />
          <div className="h-1 w-2 bg-white/80 rounded-full" />
        </div>
        <div className="flex-1" />
        <div className="h-2 w-6 bg-white rounded-full" />
      </div>
    ),
    corporate: (
      <div className="w-full h-full bg-slate-800 rounded p-2 flex flex-col gap-1">
        <div className="h-1 w-10 bg-blue-400 rounded" />
        <div className="h-0.5 w-8 bg-slate-400 rounded" />
        <div className="flex-1 flex gap-0.5 mt-1">
          <div className="w-3 h-3 bg-slate-600 rounded" />
          <div className="w-3 h-3 bg-slate-600 rounded" />
        </div>
        <div className="h-1.5 w-6 bg-blue-400 rounded" />
      </div>
    ),
    bold: (
      <div className="w-full h-full bg-black rounded p-2 flex flex-col gap-1">
        <div className="h-2 w-full bg-red-500 rounded" />
        <div className="h-1 w-10 bg-white rounded" />
        <div className="flex-1" />
        <div className="h-2 w-8 bg-yellow-400 rounded" />
      </div>
    ),
  };

  return (
    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200">
      {previews[style] || previews.minimal}
    </div>
  );
}

interface StyleCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function StyleCard({
  state,
  onStateUpdated,
}: StyleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "design_style", true);
  const source = getFieldSource("design_style", state) as SourceType;

  // Get priority options
  const userOverrideValue = state.project_meta?.user_overrides?.design_style as string | undefined;
  const inferredValue = state.project_meta?.inferred?.design_style?.value as string | undefined;
  const priorityResult = useMemo(() => {
    return buildPriorityOptions(
      STYLE_OPTIONS,
      userOverrideValue,
      inferredValue,
      currentValue,
      state,
      "design_style"
    );
  }, [userOverrideValue, inferredValue, currentValue, state]);

  useEffect(() => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
  }, [currentValue, priorityResult?.selectedValue]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!value) return;

    setLoading(true);
    try {
      await updateProject({
        design_style: value,
        project_meta: {
          user_overrides: {
            design_style: value,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[StyleCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
    setIsEditing(false);
  };

  const styleValue = typeof currentValue === "string" ? currentValue : "";
  const styleLabel = STYLE_OPTIONS.find((opt) => opt.value === styleValue)?.label || styleValue || "";
  const styleOption = STYLE_OPTIONS.find((opt) => opt.value === styleValue);
  
  // Check for generated visuals if no predefined option
  const generatedVisuals = useMemo(() => {
    if (!styleValue || styleOption) return null;
    return getFieldVisuals("design_style", styleValue, state);
  }, [styleValue, styleOption, state]);

  const displayValue = styleValue ? (
    styleOption ? (
      <div className="space-y-3">
        <StylePreview style={styleValue} />
        <p className="text-base font-semibold text-text-primary">{styleLabel}</p>
        {styleOption.description && (
          <p className="text-sm text-text-muted">
            {styleOption.description}
          </p>
        )}
      </div>
    ) : generatedVisuals ? (
      <div className="space-y-3">
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Palette size={32} className="text-gray-400" />
        </div>
        {renderCustomFieldDisplay(styleValue, generatedVisuals, styleLabel)}
      </div>
    ) : (
      <div className="space-y-3">
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Palette size={32} className="text-gray-400" />
        </div>
        <p className="text-base font-semibold text-text-primary">{styleLabel}</p>
        <p className="text-sm text-text-muted">Custom design style</p>
      </div>
    )
  ) : (
    <p className="text-text-muted italic text-sm">Select design style</p>
  );

  return (
    <FieldCard
      label="Style"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      required
      emptyPlaceholder="Select design style"
      icon={Palette}
      iconColor="#A855F7"
    >
      <StyleChooser
        options={priorityResult?.options || STYLE_OPTIONS}
        value={value}
        onChange={setValue}
        priorityMeta={priorityResult?.priorityMeta}
      />
    </FieldCard>
  );
}
