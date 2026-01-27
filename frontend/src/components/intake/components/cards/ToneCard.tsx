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
import { MessageCircle, Briefcase, Smile, Coffee, Award, Sparkles, Zap } from "lucide-react";
import { getFieldVisuals, renderCustomFieldDisplay } from "../visualHelpers";

// Tone visual mapping
const toneVisuals: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; characteristics: string[] }> = {
  professional: {
    icon: Briefcase,
    color: "#3B82F6",
    characteristics: ["Formal", "Business-like", "Trustworthy"]
  },
  friendly: {
    icon: Smile,
    color: "#22C55E",
    characteristics: ["Warm", "Approachable", "Welcoming"]
  },
  casual: {
    icon: Coffee,
    color: "#F59E0B",
    characteristics: ["Relaxed", "Conversational", "Easy-going"]
  },
  authoritative: {
    icon: Award,
    color: "#8B5CF6",
    characteristics: ["Expert", "Confident", "Credible"]
  },
  playful: {
    icon: Sparkles,
    color: "#EC4899",
    characteristics: ["Fun", "Lighthearted", "Energetic"]
  },
  inspirational: {
    icon: Zap,
    color: "#F59E0B",
    characteristics: ["Motivating", "Uplifting", "Empowering"]
  },
};

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
      currentValue,
      state,
      "tone"
    );
  }, [userOverrideValue, inferredValue, currentValue, state]);

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

  const toneValue = typeof currentValue === "string" ? currentValue : "";
  const toneLabel = TONE_OPTIONS.find((opt) => opt.value === toneValue)?.label || toneValue || "";
  const toneVisual = toneValue ? toneVisuals[toneValue] : null;
  
  // Check for generated visuals if no predefined visual
  const generatedVisuals = useMemo(() => {
    if (!toneValue || toneVisual) return null;
    return getFieldVisuals("tone", toneValue, state, toneVisuals);
  }, [toneValue, toneVisual, state]);

  const displayValue = toneValue ? (
    toneVisual ? (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: `${toneVisual.color}15`,
              color: toneVisual.color
            }}
          >
            <toneVisual.icon size={24} style={{ color: toneVisual.color }} />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{toneLabel}</p>
            <p className="text-sm text-text-muted">
              {TONE_OPTIONS.find((opt) => opt.value === toneValue)?.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {toneVisual.characteristics.map((char, i) => (
            <span
              key={i}
              className="px-2 py-1 text-xs rounded-md"
              style={{
                backgroundColor: `${toneVisual.color}10`,
                color: toneVisual.color,
                border: `1px solid ${toneVisual.color}30`
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    ) : generatedVisuals ? (
      renderCustomFieldDisplay(toneValue, generatedVisuals, toneLabel)
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: "#6B728015",
              color: "#6B7280"
            }}
          >
            <MessageCircle size={24} style={{ color: "#6B7280" }} />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{toneLabel}</p>
            <p className="text-sm text-text-muted">Custom tone</p>
          </div>
        </div>
      </div>
    )
  ) : (
    <p className="text-text-muted italic text-sm">Select tone of voice</p>
  );

  return (
    <FieldCard
      label="Brand Tone"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select tone of voice"
      icon={MessageCircle}
      iconColor="#A855F7"
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
