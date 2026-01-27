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
import { Briefcase, Code, ShoppingCart, Heart, DollarSign, GraduationCap, Utensils, Home, Scale, Palette, HeartHandshake, LucideIcon } from "lucide-react";

// Industry visual mapping
const industryVisuals: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; characteristics: string[] }> = {
  technology: {
    icon: Code,
    color: "#3B82F6",
    characteristics: ["Innovation", "Digital", "Cutting-edge"]
  },
  ecommerce: {
    icon: ShoppingCart,
    color: "#10B981",
    characteristics: ["Retail", "Online", "Marketplace"]
  },
  healthcare: {
    icon: Heart,
    color: "#EF4444",
    characteristics: ["Wellness", "Medical", "Care"]
  },
  finance: {
    icon: DollarSign,
    color: "#059669",
    characteristics: ["Financial", "Secure", "Trusted"]
  },
  education: {
    icon: GraduationCap,
    color: "#8B5CF6",
    characteristics: ["Learning", "Knowledge", "Growth"]
  },
  restaurant: {
    icon: Utensils,
    color: "#F59E0B",
    characteristics: ["Culinary", "Dining", "Experience"]
  },
  real_estate: {
    icon: Home,
    color: "#EC4899",
    characteristics: ["Properties", "Housing", "Investment"]
  },
  professional_services: {
    icon: Briefcase,
    color: "#6366F1",
    characteristics: ["Expert", "Consulting", "Professional"]
  },
  creative: {
    icon: Palette,
    color: "#A855F7",
    characteristics: ["Design", "Artistic", "Innovative"]
  },
  nonprofit: {
    icon: HeartHandshake,
    color: "#22C55E",
    characteristics: ["Community", "Impact", "Purpose"]
  },
  other: {
    icon: Briefcase,
    color: "#6B7280",
    characteristics: ["Custom", "Unique", "Specialized"]
  },
};

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

  const industryValue = typeof currentValue === "string" ? currentValue : "";
  const industryLabel = INDUSTRY_OPTIONS.find((opt) => opt.value === industryValue)?.label || industryValue || "";
  const industryVisual = industryValue ? industryVisuals[industryValue] : null;
  const IndustryIcon = industryVisual?.icon || Briefcase;

  const displayValue = industryValue && industryVisual ? (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: `${industryVisual.color}15`,
            color: industryVisual.color
          }}
        >
          <IndustryIcon size={24} style={{ color: industryVisual.color }} />
        </div>
        <div>
          <p className="text-base font-semibold text-text-primary">{industryLabel}</p>
          <p className="text-sm text-text-muted">
            {INDUSTRY_OPTIONS.find((opt) => opt.value === industryValue)?.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {industryVisual.characteristics.map((char, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs rounded-md"
            style={{
              backgroundColor: `${industryVisual.color}10`,
              color: industryVisual.color,
              border: `1px solid ${industryVisual.color}30`
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-text-muted italic text-sm">Select your industry</p>
  );

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
      icon={Briefcase}
      iconColor="#3B82F6"
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
