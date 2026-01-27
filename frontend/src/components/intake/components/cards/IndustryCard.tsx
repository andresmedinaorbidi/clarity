"use client";
/**
 * IndustryCard - Card for industry selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, INDUSTRY_OPTIONS, buildPriorityOptions } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import SingleSelectChips from "../pickers/SingleSelectChips";

interface IndustryCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function IndustryCard({
  state,
  onStateUpdated,
}: IndustryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "industry", true);
  const source = getFieldSource("industry", state) as SourceType;

  // Get priority options
  const userOverrideValue = state.project_meta?.user_overrides?.industry as string | undefined;
  const inferredValue = state.project_meta?.inferred?.industry?.value as string | undefined;
  const priorityResult = useMemo(() => {
    return buildPriorityOptions(
      INDUSTRY_OPTIONS,
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
        industry: value,
        project_meta: {
          user_overrides: {
            industry: value,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[IndustryCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
    setIsEditing(false);
  };

  const displayValue = INDUSTRY_OPTIONS.find((opt) => opt.value === currentValue)?.label || currentValue || "";

  return (
    <FieldCard
      label="Industry"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      required
      emptyPlaceholder="Select your industry"
    >
      <SingleSelectChips
        options={priorityResult?.options || INDUSTRY_OPTIONS}
        value={value}
        onChange={setValue}
        priorityMeta={priorityResult?.priorityMeta}
      />
    </FieldCard>
  );
}
