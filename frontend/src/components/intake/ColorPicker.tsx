"use client";
import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ColorOption {
  value: string;
  label: string;
  hex: string;
}

// Preset color palettes
export const PRESET_COLORS: ColorOption[] = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "navy", label: "Navy", hex: "#1E3A5F" },
  { value: "royal-blue", label: "Royal Blue", hex: "#4169E1" },
  { value: "teal", label: "Teal", hex: "#008080" },
  { value: "emerald", label: "Emerald", hex: "#50C878" },
  { value: "lime", label: "Lime", hex: "#32CD32" },
  { value: "gold", label: "Gold", hex: "#FFD700" },
  { value: "orange", label: "Orange", hex: "#FF8C00" },
  { value: "coral", label: "Coral", hex: "#FF7F50" },
  { value: "red", label: "Red", hex: "#DC143C" },
  { value: "pink", label: "Pink", hex: "#FF69B4" },
  { value: "purple", label: "Purple", hex: "#8B5CF6" },
  { value: "lavender", label: "Lavender", hex: "#E6E6FA" },
  { value: "slate", label: "Slate", hex: "#64748B" },
  { value: "cream", label: "Cream", hex: "#FFFDD0" },
];

interface ColorPickerProps {
  label: string;
  value: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
  inferredValue?: string[];
  showInferredBadge?: boolean;
}

export default function ColorPicker({
  label,
  value = [],
  onChange,
  maxColors = 4,
  inferredValue = [],
  showInferredBadge = true,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState("#000000");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleColorToggle = (colorValue: string) => {
    if (value.includes(colorValue)) {
      onChange(value.filter((c) => c !== colorValue));
    } else if (value.length < maxColors) {
      onChange([...value, colorValue]);
    }
  };

  const handleAddCustomColor = () => {
    if (customColor && value.length < maxColors && !value.includes(customColor)) {
      onChange([...value, customColor]);
      setShowCustomInput(false);
    }
  };

  const isSelected = (colorValue: string) => value.includes(colorValue);
  const isInferred = (colorValue: string) =>
    inferredValue.includes(colorValue) && !value.includes(colorValue);

  const getColorHex = (colorValue: string) => {
    const preset = PRESET_COLORS.find((c) => c.value === colorValue);
    return preset?.hex || colorValue;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">{label}</label>
        <span className="text-xs text-text-muted">
          {value.length}/{maxColors} selected
        </span>
      </div>

      {/* Selected Colors Preview */}
      {value.length > 0 && (
        <div className="flex gap-2 p-3 bg-brand-surface rounded-xl border border-brand-border">
          {value.map((colorValue) => (
            <motion.div
              key={colorValue}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative group"
            >
              <div
                className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                style={{ backgroundColor: getColorHex(colorValue) }}
              />
              <button
                type="button"
                onClick={() => handleColorToggle(colorValue)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Color Grid */}
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => {
          const selected = isSelected(color.value);
          const inferred = isInferred(color.value);

          return (
            <motion.button
              key={color.value}
              type="button"
              onClick={() => handleColorToggle(color.value)}
              whileTap={{ scale: 0.9 }}
              disabled={!selected && value.length >= maxColors}
              className={`
                relative w-full aspect-square rounded-lg transition-all duration-200
                ${selected ? "ring-2 ring-brand-primary ring-offset-2" : ""}
                ${inferred && showInferredBadge ? "ring-2 ring-brand-accent ring-offset-1" : ""}
                ${!selected && value.length >= maxColors ? "opacity-40 cursor-not-allowed" : "hover:scale-110"}
              `}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            >
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    size={16}
                    className={color.hex === "#FFFFFF" || color.hex === "#FFFDD0" ? "text-black" : "text-white"}
                  />
                </div>
              )}
              {inferred && showInferredBadge && !selected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[8px] font-bold bg-brand-accent text-white rounded-full flex items-center justify-center">
                  AI
                </span>
              )}
            </motion.button>
          );
        })}

        {/* Custom Color Button */}
        <motion.button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          whileTap={{ scale: 0.9 }}
          disabled={value.length >= maxColors}
          className={`
            w-full aspect-square rounded-lg border-2 border-dashed border-brand-border
            flex items-center justify-center transition-all
            ${value.length >= maxColors ? "opacity-40 cursor-not-allowed" : "hover:border-brand-primary hover:bg-brand-primary/10"}
          `}
        >
          <Plus size={16} className="text-text-muted" />
        </motion.button>
      </div>

      {/* Custom Color Input */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-brand-border"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-brand-border bg-white focus:border-brand-primary outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomColor}
              className="px-4 py-2 bg-brand-primary text-text-primary rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors"
            >
              Add
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
