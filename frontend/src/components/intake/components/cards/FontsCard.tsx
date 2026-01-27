"use client";
/**
 * FontsCard - Card for font pairing selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, FONT_OPTIONS, buildPriorityOptions } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import FontPicker from "../pickers/FontPicker";

interface FontsCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function FontsCard({
  state,
  onStateUpdated,
}: FontsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "font_pair", false);
  const source = getFieldSource("font_pair", state) as SourceType;

  // Get priority options
  const userOverrideValue = state.project_meta?.user_overrides?.font_pair as string | undefined;
  const inferredValue = state.project_meta?.inferred?.font_pair?.value as string | undefined;
  const priorityResult = useMemo(() => {
    return buildPriorityOptions(
      FONT_OPTIONS,
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
    setLoading(true);
    try {
      await updateProject({
        project_meta: {
          user_overrides: {
            font_pair: value || null,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[FontsCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
    setIsEditing(false);
  };

  const displayValue = FONT_OPTIONS.find((opt) => opt.value === currentValue)?.label || currentValue || "";

  return (
    <FieldCard
      label="Fonts"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select font pairing"
    >
      <FontPicker
        options={priorityResult?.options || FONT_OPTIONS}
        value={value}
        onChange={setValue}
        priorityMeta={priorityResult?.priorityMeta}
      />
    </FieldCard>
  );
}
