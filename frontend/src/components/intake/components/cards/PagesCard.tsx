"use client";
/**
 * PagesCard - Card for page selection
 */

import React, { useState, useEffect } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue, PAGE_OPTIONS } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import MultiSelectChips from "../pickers/MultiSelectChips";
import { FileText } from "lucide-react";

interface PagesCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function PagesCard({
  state,
  onStateUpdated,
}: PagesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "draft_pages", false, true) || state.additional_context?.draft_pages;
  const source = getFieldSource("draft_pages", state) as SourceType;

  useEffect(() => {
    setValue(Array.isArray(currentValue) ? currentValue : []);
  }, [currentValue]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProject({
        additional_context: {
          draft_pages: value,
        },
        project_meta: {
          user_overrides: {
            draft_pages: value,
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[PagesCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(Array.isArray(currentValue) ? currentValue : []);
    setIsEditing(false);
  };

  const displayValue = value.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {value.map((page) => {
        const option = PAGE_OPTIONS.find((opt) => opt.value === page);
        return (
          <span
            key={page}
            className="px-2 py-1 text-xs bg-brand-dark border border-brand-border rounded-md text-text-primary"
          >
            {option?.label || page}
          </span>
        );
      })}
    </div>
  ) : null;

  return (
    <FieldCard
      label="Pages"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select pages for your website"
      icon={FileText}
      iconColor="#10B981"
    >
      <MultiSelectChips
        options={PAGE_OPTIONS}
        value={value}
        onChange={setValue}
        columns={4}
      />
    </FieldCard>
  );
}
