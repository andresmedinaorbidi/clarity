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
import { Target, Users, ShoppingBag, Sparkles, Info, Briefcase, Calendar, LucideIcon } from "lucide-react";

// Goal visual mapping
const goalVisuals: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; characteristics: string[] }> = {
  lead_generation: {
    icon: Users,
    color: "#3B82F6",
    characteristics: ["Capture", "Convert", "Engage"]
  },
  sell_products: {
    icon: ShoppingBag,
    color: "#10B981",
    characteristics: ["E-commerce", "Sales", "Revenue"]
  },
  build_brand: {
    icon: Sparkles,
    color: "#8B5CF6",
    characteristics: ["Awareness", "Identity", "Presence"]
  },
  inform: {
    icon: Info,
    color: "#06B6D4",
    characteristics: ["Education", "Resources", "Information"]
  },
  portfolio: {
    icon: Briefcase,
    color: "#F59E0B",
    characteristics: ["Showcase", "Projects", "Work"]
  },
  booking: {
    icon: Calendar,
    color: "#EC4899",
    characteristics: ["Appointments", "Reservations", "Scheduling"]
  },
};

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

  const goalValue = typeof currentValue === "string" ? currentValue : "";
  const goalLabel = GOAL_OPTIONS.find((opt) => opt.value === goalValue)?.label || goalValue || "";
  const goalVisual = goalValue ? goalVisuals[goalValue] : null;
  const GoalIcon = goalVisual?.icon || Target;

  const displayValue = goalValue && goalVisual ? (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: `${goalVisual.color}15`,
            color: goalVisual.color
          }}
        >
          <GoalIcon size={24} style={{ color: goalVisual.color }} />
        </div>
        <div>
          <p className="text-base font-semibold text-text-primary">{goalLabel}</p>
          <p className="text-sm text-text-muted">
            {GOAL_OPTIONS.find((opt) => opt.value === goalValue)?.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {goalVisual.characteristics.map((char, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs rounded-md"
            style={{
              backgroundColor: `${goalVisual.color}10`,
              color: goalVisual.color,
              border: `1px solid ${goalVisual.color}30`
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-text-muted italic text-sm">Select your website goal</p>
  );

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
      icon={Target}
      iconColor="#EF4444"
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
