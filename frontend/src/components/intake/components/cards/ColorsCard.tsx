"use client";
/**
 * ColorsCard - Card for brand colors selection
 */

import React, { useState, useEffect, useMemo } from "react";
import FieldCard from "../FieldCard";
import { getFieldSource, getFieldValue } from "../../intakeQuestions";
import type { WebsiteState } from "@/hooks/use-orchestrator";
import { updateProject, getProjectState } from "@/lib/api";
import type { SourceType } from "../SourceBadge";
import ColorPicker from "../pickers/ColorPicker";
import { Brain } from "lucide-react";

// Helper function to get color name from hex
function getColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    "#000000": "Black",
    "#FFFFFF": "White",
    "#1F1D1E": "Black",
    "#BEFF50": "Vivid Green",
    "#FFEB3B": "Light Yellow",
    "#60259F": "Purple",
    "#E5E7EB": "Light Gray",
    "#F5F5EB": "Cream",
    "#111827": "Dark Gray",
    "#6B7280": "Gray",
  };

  const normalizedHex = hex.toUpperCase();
  if (colorMap[normalizedHex]) {
    return colorMap[normalizedHex];
  }

  // Try to infer from hex value
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Simple color name inference
  if (r === g && g === b) {
    if (r < 85) return "Dark Gray";
    if (r < 170) return "Gray";
    return "Light Gray";
  }

  if (r > g && r > b) {
    if (g > b) return "Orange";
    return "Red";
  }
  if (g > r && g > b) {
    if (r > b) return "Yellow Green";
    return "Green";
  }
  if (b > r && b > g) {
    if (r > g) return "Purple";
    return "Blue";
  }

  return "Custom";
}

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
  
  // Create color items with names
  const colorItems = useMemo(() => {
    return displayColors.map((color) => ({
      hex: color,
      name: getColorName(color),
    }));
  }, [displayColors]);

  const displayValue = colorItems.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {colorItems.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div
            className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
            style={{ backgroundColor: item.hex }}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted font-mono">{item.hex}</p>
          </div>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <FieldCard
      label="Brand Colors"
      value={displayValue}
      source={source}
      isEditing={isEditing}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      loading={loading}
      required
      emptyPlaceholder="Select brand colors"
      icon={Brain}
      iconColor="#60A5FA"
    >
      <ColorPicker value={value} onChange={setValue} />
    </FieldCard>
  );
}
