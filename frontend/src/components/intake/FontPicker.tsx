"use client";
import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export interface FontOption {
  value: string;
  label: string;
  preview: string;
  fontFamily: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    value: "modern-sans",
    label: "Modern Sans",
    preview: "Aa",
    fontFamily: "'Inter', sans-serif",
    description: "Clean and contemporary",
  },
  {
    value: "classic-serif",
    label: "Classic Serif",
    preview: "Aa",
    fontFamily: "'Georgia', serif",
    description: "Elegant and timeless",
  },
  {
    value: "geometric",
    label: "Geometric",
    preview: "Aa",
    fontFamily: "'Poppins', sans-serif",
    description: "Bold and structured",
  },
  {
    value: "humanist",
    label: "Humanist",
    preview: "Aa",
    fontFamily: "'Open Sans', sans-serif",
    description: "Friendly and approachable",
  },
  {
    value: "monospace",
    label: "Monospace",
    preview: "Aa",
    fontFamily: "'JetBrains Mono', monospace",
    description: "Technical and precise",
  },
  {
    value: "display",
    label: "Display",
    preview: "Aa",
    fontFamily: "'Playfair Display', serif",
    description: "Dramatic and artistic",
  },
];

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  inferredValue?: string;
  showInferredBadge?: boolean;
}

export default function FontPicker({
  label,
  value,
  onChange,
  inferredValue,
  showInferredBadge = true,
}: FontPickerProps) {
  const isSelected = (fontValue: string) => value === fontValue;
  const isInferred = (fontValue: string) =>
    inferredValue === fontValue && value !== fontValue;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FONT_OPTIONS.map((font) => {
          const selected = isSelected(font.value);
          const inferred = isInferred(font.value);

          return (
            <motion.button
              key={font.value}
              type="button"
              onClick={() => onChange(font.value)}
              whileTap={{ scale: 0.97 }}
              className={`
                relative p-4 rounded-xl border transition-all duration-200 text-left
                ${
                  selected
                    ? "bg-brand-primary/10 border-brand-primary shadow-md"
                    : inferred && showInferredBadge
                    ? "bg-brand-accent/5 border-brand-accent/30 hover:border-brand-accent/50"
                    : "bg-brand-surface border-brand-border hover:border-brand-primary/50"
                }
              `}
            >
              {/* Font Preview */}
              <div
                className="text-3xl font-bold text-text-primary mb-2"
                style={{ fontFamily: font.fontFamily }}
              >
                {font.preview}
              </div>

              {/* Font Name */}
              <div className="text-sm font-medium text-text-primary">{font.label}</div>

              {/* Font Description */}
              <div className="text-xs text-text-muted mt-0.5">{font.description}</div>

              {/* Selection Indicator */}
              {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                  <Check size={12} className="text-text-primary" />
                </div>
              )}

              {/* Inferred Badge */}
              {inferred && showInferredBadge && !selected && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-brand-accent text-white rounded-full">
                  AI
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
