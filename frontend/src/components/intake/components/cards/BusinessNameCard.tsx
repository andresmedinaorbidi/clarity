"use client";
/**
 * BusinessNameCard - Card for business/project name
 */

import React, { useState, useEffect } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";

interface BusinessNameCardProps {
  state: WebsiteState;
  onStateUpdated: (newState: WebsiteState) => void;
}

export default function BusinessNameCard({
  state,
  onStateUpdated,
}: BusinessNameCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const currentValue = getFieldValue(state, "project_name", true);
  const source = getFieldSource("project_name", state) as SourceType;

  useEffect(() => {
    setValue(typeof currentValue === "string" ? currentValue : "");
  }, [currentValue]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!value.trim()) return;

    setLoading(true);
    try {
      await updateProject({
        project_name: value.trim(),
        project_meta: {
          user_overrides: {
            project_name: value.trim(),
          },
        },
      });
      const freshState = await getProjectState();
      onStateUpdated(freshState as WebsiteState);
      setIsEditing(false);
    } catch (error) {
      console.error("[BusinessNameCard] Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(typeof currentValue === "string" ? currentValue : "");
    setIsEditing(false);
  };

  return (
    <FieldCard
      label="Business Name"
      value={currentValue || ""}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      required
      emptyPlaceholder="Enter your business name"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., Acme Corp, Jane's Photography"
        className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        }}
      />
    </FieldCard>
  );
}
