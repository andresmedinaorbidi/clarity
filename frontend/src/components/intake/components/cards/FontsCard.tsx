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
import { Type } from "lucide-react";

// Font pair mapping
const fontMap: Record<string, { heading: string; body: string; headingFamily: string; bodyFamily: string }> = {
  inter_playfair: { 
    heading: "Playfair Display", 
    body: "Inter",
    headingFamily: "'Playfair Display', serif",
    bodyFamily: "'Inter', sans-serif"
  },
  poppins_lora: { 
    heading: "Lora", 
    body: "Poppins",
    headingFamily: "'Lora', serif",
    bodyFamily: "'Poppins', sans-serif"
  },
  roboto_roboto_slab: { 
    heading: "Roboto Slab", 
    body: "Roboto",
    headingFamily: "'Roboto Slab', serif",
    bodyFamily: "'Roboto', sans-serif"
  },
  montserrat_merriweather: { 
    heading: "Montserrat", 
    body: "Merriweather",
    headingFamily: "'Montserrat', sans-serif",
    bodyFamily: "'Merriweather', serif"
  },
  open_sans_oswald: { 
    heading: "Oswald", 
    body: "Open Sans",
    headingFamily: "'Oswald', sans-serif",
    bodyFamily: "'Open Sans', sans-serif"
  },
  system: { 
    heading: "System UI", 
    body: "System UI",
    headingFamily: "system-ui, sans-serif",
    bodyFamily: "system-ui, sans-serif"
  },
};

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

  // Get font info for display
  const fontInfo = useMemo(() => {
    const fontValue = typeof currentValue === "string" ? currentValue : "";
    return fontMap[fontValue] || null;
  }, [currentValue]);

  const displayValue = fontInfo ? (
    <div className="space-y-4">
      {/* Display Font Section */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">Display Font</p>
        <p
          className="text-2xl font-bold text-text-primary mb-1"
          style={{ 
            fontFamily: fontInfo.headingFamily,
            fontStyle: fontInfo.headingFamily.includes('serif') ? 'italic' : 'normal'
          }}
        >
          {fontInfo.heading}
        </p>
        <p className="text-sm text-text-muted">{fontInfo.heading}</p>
      </div>

      {/* Body Font Section */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2">Body Font</p>
        <p
          className="text-base text-text-primary mb-1"
          style={{ fontFamily: fontInfo.bodyFamily }}
        >
          {fontInfo.body}
        </p>
        <p className="text-sm text-text-muted">{fontInfo.body}</p>
      </div>
    </div>
  ) : (
    <p className="text-text-muted italic text-sm">Select font pairing</p>
  );

  return (
    <FieldCard
      label="Typography"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      emptyPlaceholder="Select font pairing"
      icon={Type}
      iconColor="#22C55E"
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
