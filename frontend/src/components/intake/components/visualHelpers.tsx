/**
 * Visual Helpers - Utilities for retrieving and rendering field visuals
 * 
 * Handles visual metadata retrieval for field values, including:
 * - Predefined visuals (from card components)
 * - Mapped visuals (from field_mappings)
 * - Generated visuals (from field_visuals)
 * - Generic fallbacks
 */

import React from "react";
import {
  Briefcase, Code, ShoppingCart, Heart, DollarSign, GraduationCap,
  Utensils, Home, Scale, Palette, HeartHandshake, Building2,
  Target, MessageCircle, Smile, Coffee, Award, Sparkles, Zap,
  TrendingUp, Users, Globe, Rocket, Star, Lightbulb, Puzzle,
  Shield, Gift, Camera, Music, Book, Gamepad2, Car, Plane,
  LucideIcon
} from "lucide-react";

// Icon name to component mapping
const iconMap: Record<string, LucideIcon> = {
  Briefcase, Code, ShoppingCart, Heart, DollarSign, GraduationCap,
  Utensils, Home, Scale, Palette, HeartHandshake, Building2,
  Target, MessageCircle, Smile, Coffee, Award, Sparkles, Zap,
  TrendingUp, Users, Globe, Rocket, Star, Lightbulb, Puzzle,
  Shield, Gift, Camera, Music, Book, Gamepad2, Car, Plane,
};

export interface FieldVisuals {
  icon: LucideIcon;
  color: string;
  characteristics: string[];
}

/**
 * Get icon component by name
 */
export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Briefcase; // Default to Briefcase if not found
}

/**
 * Get visual metadata for a field value
 * Priority: predefined visuals → mapped visuals → generated visuals → generic fallback
 */
export function getFieldVisuals(
  fieldName: string,
  value: string | undefined,
  state: {
    project_meta?: {
      field_mappings?: Record<string, { original_value?: string; mapped_value?: string; confidence?: number }>;
      field_visuals?: Record<string, { icon?: string; color?: string; characteristics?: string[] }>;
    };
  },
  predefinedVisuals?: Record<string, { icon: LucideIcon; color: string; characteristics: string[] }>
): FieldVisuals | null {
  if (!value) return null;

  // 1. Check predefined visuals first (if provided)
  if (predefinedVisuals && predefinedVisuals[value]) {
    return predefinedVisuals[value];
  }

  // 2. Check if value was mapped to a predefined option
  const mappings = state.project_meta?.field_mappings || {};
  if (fieldName in mappings) {
    const mapping = mappings[fieldName];
    const mappedValue = mapping.mapped_value;
    if (mappedValue && mapping.confidence && mapping.confidence >= 0.7) {
      // Use predefined visuals for mapped value
      if (predefinedVisuals && predefinedVisuals[mappedValue]) {
        return predefinedVisuals[mappedValue];
      }
    }
  }

  // 3. Check generated visuals from backend
  const visuals = state.project_meta?.field_visuals || {};
  if (fieldName in visuals) {
    const visualData = visuals[fieldName];
    if (visualData) {
      return {
        icon: getIconComponent(visualData.icon || "Briefcase"),
        color: visualData.color || "#6B7280",
        characteristics: visualData.characteristics || ["Custom", "Unique", "Specialized"]
      };
    }
  }

  // 4. Generic fallback
  return getGenericFallbackVisuals(fieldName);
}

/**
 * Get generic fallback visuals for a field type
 */
function getGenericFallbackVisuals(fieldName: string): FieldVisuals {
  const fallbacks: Record<string, FieldVisuals> = {
    industry: {
      icon: Briefcase,
      color: "#6B7280",
      characteristics: ["Business", "Professional", "Custom"]
    },
    tone: {
      icon: MessageCircle,
      color: "#6B7280",
      characteristics: ["Custom", "Unique", "Distinctive"]
    },
    design_style: {
      icon: Palette,
      color: "#6B7280",
      characteristics: ["Custom", "Unique", "Specialized"]
    },
    goal: {
      icon: Target,
      color: "#6B7280",
      characteristics: ["Custom", "Specific", "Tailored"]
    },
    font_pair: {
      icon: Book,
      color: "#6B7280",
      characteristics: ["Custom", "Typography", "Unique"]
    }
  };

  return fallbacks[fieldName] || {
    icon: Briefcase,
    color: "#6B7280",
    characteristics: ["Custom", "Unique", "Specialized"]
  };
}

/**
 * Render a custom field display with visuals
 */
export function renderCustomFieldDisplay(
  value: string,
  visuals: FieldVisuals,
  label?: string
): React.ReactNode {
  const IconComponent = visuals.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${visuals.color}15`,
            color: visuals.color
          }}
        >
          <IconComponent size={24} style={{ color: visuals.color }} />
        </div>
        <div>
          <p className="text-base font-semibold text-text-primary">{label || value}</p>
          {label && value !== label && (
            <p className="text-sm text-text-muted">{value}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visuals.characteristics.map((char, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs rounded-md"
            style={{
              backgroundColor: `${visuals.color}10`,
              color: visuals.color,
              border: `1px solid ${visuals.color}30`
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
