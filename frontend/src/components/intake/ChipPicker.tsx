"use client";
import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export interface ChipOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ChipPickerProps {
  label: string;
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  columns?: 2 | 3 | 4;
  inferredValue?: string | string[];
  showInferredBadge?: boolean;
}

export default function ChipPicker({
  label,
  options,
  value,
  onChange,
  multiple = false,
  columns = 3,
  inferredValue,
  showInferredBadge = true,
}: ChipPickerProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const inferredValues = Array.isArray(inferredValue)
    ? inferredValue
    : inferredValue
    ? [inferredValue]
    : [];

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue === value ? "" : optionValue);
    }
  };

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);
  const isInferred = (optionValue: string) =>
    inferredValues.includes(optionValue) && !selectedValues.includes(optionValue);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">{label}</label>
      <div className={`grid ${gridCols[columns]} gap-2`}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          const inferred = isInferred(option.value);

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              whileTap={{ scale: 0.97 }}
              className={`
                relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                border transition-all duration-200
                ${
                  selected
                    ? "bg-brand-primary text-text-primary border-brand-primary shadow-md"
                    : inferred && showInferredBadge
                    ? "bg-brand-accent/10 text-brand-accent border-brand-accent/30 hover:border-brand-accent/50"
                    : "bg-brand-surface text-text-secondary border-brand-border hover:border-brand-primary/50 hover:text-text-primary"
                }
              `}
            >
              {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
              {selected && (
                <Check size={16} className="absolute right-2 top-1/2 -translate-y-1/2" />
              )}
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
