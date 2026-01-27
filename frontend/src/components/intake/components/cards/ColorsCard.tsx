"use client";
/**
 * ColorsCard - Card for brand colors selection
 */

import React, { useState, useEffect } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import ColorPicker from "../pickers/ColorPicker";

interface ColorsCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function ColorsCard({
  state,
  onStateUpdated,
}: ColorsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "brand_colors", true);
  const source = getFieldSource("brand_colors", state) as SourceType;

  useEffect(() => {
    setValue(Array.isArray(currentValue) ? currentValue : []);
  }, [currentValue]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (value.length === 0) return;

    setLoading(true);
    try {
      await updateProject({
        brand_colors: value,
        project_meta: {
          user_overrides: {
            brand_colors: value,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[ColorsCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(Array.isArray(currentValue) ? currentValue : []);
    setIsEditing(false);
  };

  const displayColors = Array.isArray(currentValue) ? currentValue : [];
  const displayValue = displayColors.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {displayColors.slice(0, 6).map((color, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-lg border border-brand-border shadow-sm"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      {displayColors.length > 6 && (
        <span className="text-sm text-text-muted">+{displayColors.length - 6}</span>
      )}
    </div>
  ) : null;

  return (
    <FieldCard
      label="Colors"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      required
      emptyPlaceholder="Select brand colors"
    >
      <ColorPicker value={value} onChange={setValue} />
    </FieldCard>
  );
}
