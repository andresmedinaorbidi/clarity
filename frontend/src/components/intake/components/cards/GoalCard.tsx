"use client";
/**
 * GoalCard - Card for website goal selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, GOAL_OPTIONS, buildPriorityOptions } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import SingleSelectChips from "../pickers/SingleSelectChips";

interface GoalCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function GoalCard({
  state,
  onStateUpdated,
}: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "goal", false);
  const source = getFieldSource("goal", state) as SourceType;

  // Get priority options
  const userOverrideValue = state.project_meta?.user_overrides?.goal as string | undefined;
  const inferredValue = state.project_meta?.inferred?.goal?.value as string | undefined;
  const priorityResult = useMemo(() => {
    return buildPriorityOptions(
      GOAL_OPTIONS,
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
            goal: value || null,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[GoalCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : priorityResult?.selectedValue);
    setIsEditing(false);
  };

  const displayValue = GOAL_OPTIONS.find((opt) => opt.value === currentValue)?.label || currentValue || "";

  return (
    <FieldCard
      label="Goal"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select your website goal"
    >
      <SingleSelectChips
        options={priorityResult?.options || GOAL_OPTIONS}
        value={value}
        onChange={setValue}
        priorityMeta={priorityResult?.priorityMeta}
      />
    </FieldCard>
  );
}
