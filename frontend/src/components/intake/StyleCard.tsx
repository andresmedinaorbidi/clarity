"use client";
import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export interface StyleOption {
  value: string;
  label: string;
  description: string;
  preview: {
    bgColor: string;
    accentColor: string;
    textColor: string;
    pattern?: "dots" | "lines" | "grid" | "none";
  };
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Clean lines, whitespace, simplicity",
    preview: {
      bgColor: "#FFFFFF",
      accentColor: "#000000",
      textColor: "#1a1a1a",
      pattern: "none",
    },
  },
  {
    value: "modern",
    label: "Modern",
    description: "Bold typography, gradients, contemporary",
    preview: {
      bgColor: "#0f172a",
      accentColor: "#3b82f6",
      textColor: "#f8fafc",
      pattern: "grid",
    },
  },
  {
    value: "elegant",
    label: "Elegant",
    description: "Sophisticated, refined, luxurious",
    preview: {
      bgColor: "#1c1917",
      accentColor: "#d4af37",
      textColor: "#fafaf9",
      pattern: "none",
    },
  },
  {
    value: "playful",
    label: "Playful",
    description: "Vibrant colors, rounded shapes, fun",
    preview: {
      bgColor: "#fef3c7",
      accentColor: "#f97316",
      textColor: "#1c1917",
      pattern: "dots",
    },
  },
  {
    value: "corporate",
    label: "Corporate",
    description: "Professional, trustworthy, structured",
    preview: {
      bgColor: "#f8fafc",
      accentColor: "#1e40af",
      textColor: "#1e293b",
      pattern: "lines",
    },
  },
  {
    value: "creative",
    label: "Creative",
    description: "Artistic, expressive, unique",
    preview: {
      bgColor: "#fdf4ff",
      accentColor: "#a855f7",
      textColor: "#581c87",
      pattern: "dots",
    },
  },
];

interface StyleCardProps {
  label: string;
  value: string;
  onChange: (style: string) => void;
  options?: StyleOption[];
  inferredValue?: string;
  showInferredBadge?: boolean;
}

// Pattern component for style preview
function PatternOverlay({ pattern, color }: { pattern?: string; color: string }) {
  if (!pattern || pattern === "none") return null;

  const patternStyles: Record<string, React.CSSProperties> = {
    dots: {
      backgroundImage: `radial-gradient(${color}20 1px, transparent 1px)`,
      backgroundSize: "8px 8px",
    },
    lines: {
      backgroundImage: `repeating-linear-gradient(90deg, ${color}10 0px, ${color}10 1px, transparent 1px, transparent 12px)`,
    },
    grid: {
      backgroundImage: `linear-gradient(${color}10 1px, transparent 1px), linear-gradient(90deg, ${color}10 1px, transparent 1px)`,
      backgroundSize: "12px 12px",
    },
  };

  return (
    <div
      className="absolute inset-0 rounded-t-lg"
      style={patternStyles[pattern] || {}}
    />
  );
}

export default function StyleCard({
  label,
  value,
  onChange,
  options = STYLE_OPTIONS,
  inferredValue,
  showInferredBadge = true,
}: StyleCardProps) {
  const isSelected = (styleValue: string) => value === styleValue;
  const isInferred = (styleValue: string) =>
    inferredValue === styleValue && value !== styleValue;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((style) => {
          const selected = isSelected(style.value);
          const inferred = isInferred(style.value);

          return (
            <motion.button
              key={style.value}
              type="button"
              onClick={() => onChange(style.value)}
              whileTap={{ scale: 0.97 }}
              className={`
                relative rounded-xl overflow-hidden border transition-all duration-200 text-left
                ${
                  selected
                    ? "ring-2 ring-brand-primary border-brand-primary shadow-lg"
                    : inferred && showInferredBadge
                    ? "ring-2 ring-brand-accent/50 border-brand-accent/30"
                    : "border-brand-border hover:border-brand-primary/50 hover:shadow-md"
                }
              `}
            >
              {/* Style Preview */}
              <div
                className="relative h-24 rounded-t-lg overflow-hidden"
                style={{ backgroundColor: style.preview.bgColor }}
              >
                <PatternOverlay
                  pattern={style.preview.pattern}
                  color={style.preview.accentColor}
                />

                {/* Mini Layout Preview */}
                <div className="absolute inset-3 flex flex-col gap-2">
                  {/* Header bar */}
                  <div
                    className="h-2 w-1/2 rounded-full"
                    style={{ backgroundColor: style.preview.accentColor }}
                  />
                  {/* Content lines */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5">
                    <div
                      className="h-1.5 w-3/4 rounded-full opacity-60"
                      style={{ backgroundColor: style.preview.textColor }}
                    />
                    <div
                      className="h-1.5 w-1/2 rounded-full opacity-40"
                      style={{ backgroundColor: style.preview.textColor }}
                    />
                  </div>
                  {/* Button */}
                  <div
                    className="h-3 w-1/3 rounded-md self-start"
                    style={{ backgroundColor: style.preview.accentColor }}
                  />
                </div>

                {/* Selection Checkmark */}
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center shadow-md">
                    <Check size={12} className="text-text-primary" />
                  </div>
                )}

                {/* Inferred Badge */}
                {inferred && showInferredBadge && !selected && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold bg-brand-accent text-white rounded-full">
                    AI
                  </span>
                )}
              </div>

              {/* Style Info */}
              <div className="p-3 bg-brand-surface">
                <div className="text-sm font-medium text-text-primary">
                  {style.label}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {style.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
