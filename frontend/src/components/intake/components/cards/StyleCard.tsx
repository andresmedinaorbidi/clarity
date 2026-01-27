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
      currentValue
    );
  }, [userOverrideValue, inferredValue, currentValue]);

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

  const displayValue = STYLE_OPTIONS.find((opt) => opt.value === currentValue)?.label || currentValue || "";

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
