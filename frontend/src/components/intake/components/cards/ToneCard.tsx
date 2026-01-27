"use client";
/**
 * ToneCard - Card for tone of voice selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, TONE_OPTIONS, buildPriorityOptions } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import SingleSelectChips from "../pickers/SingleSelectChips";

interface ToneCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function ToneCard({
  state,
  onStateUpdated,
}: ToneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "tone", false) || state.project_meta?.tone;
  const source = getFieldSource("tone", state) as SourceType;

  // Get priority options
  const userOverrideValue = state.project_meta?.user_overrides?.tone as string | undefined;
  const inferredValue = state.project_meta?.inferred?.tone?.value as string | undefined;
  const priorityResult = useMemo(() => {
    return buildPriorityOptions(
      TONE_OPTIONS,
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
            tone: value || null,
          },
          tone: value || null,
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[ToneCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
    setIsEditing(false);
  };

  const displayValue = TONE_OPTIONS.find((opt) => opt.value === currentValue)?.label || currentValue || "";

  return (
    <FieldCard
      label="Tone"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select tone of voice"
    >
      <SingleSelectChips
        options={priorityResult?.options || TONE_OPTIONS}
        value={value}
        onChange={setValue}
        priorityMeta={priorityResult?.priorityMeta}
      />
    </FieldCard>
  );
}
