"use client";
/**
 * ColorPicker - Brand color palette selector (PR-07)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLOR_PRESETS } from "../../intakeQuestions";

interface ColorPickerProps {
  value: string[];
  onChange: (colors: string[]) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState("#6366F1");

  // Check if current value matches a preset
  const selectedPreset = COLOR_PRESETS.find(
    (preset) =>
      preset.colors.length === value.length &&
      preset.colors.every((c, i) => c.toLowerCase() === value[i]?.toLowerCase())
  );

  const handlePresetSelect = (colors: string[]) => {
    onChange([...colors]);
    setShowCustom(false);
  };

  const handleAddCustomColor = () => {
    if (customColor && !value.includes(customColor.toUpperCase())) {
      const newColors = [...value, customColor.toUpperCase()].slice(0, 6);
      onChange(newColors);
    }
  };

  const handleRemoveColor = (index: number) => {
    const newColors = value.filter((_, i) => i !== index);
    onChange(newColors);
  };

  return (
    <div className="space-y-6">
      {/* Preset palettes */}
      <div>
        <p className="text-sm text-text-muted mb-3">Choose a palette</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = selectedPreset?.name === preset.name;
            return (
              <motion.button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset.colors)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  p-3 rounded-xl border-2 transition-all
                  ${
                    isSelected
                      ? "border-accent-purple shadow-lg shadow-accent-purple/20"
                      : "border-border-subtle hover:border-border-default"
                  }
                `}
              >
                {/* Color swatches */}
                <div className="flex gap-1 mb-2">
                  {preset.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded-md first:rounded-l-lg last:rounded-r-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs text-center ${
                    isSelected ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {preset.name}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Current selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-text-muted">Your colors</p>
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-accent-purple hover:underline"
          >
            {showCustom ? "Hide custom" : "Add custom color"}
          </button>
        </div>

        {/* Selected colors display */}
        <div className="flex flex-wrap gap-2">
          {value.map((color, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative group"
            >
              <div
                className="w-12 h-12 rounded-lg border-2 border-border-subtle shadow-md"
                style={{ backgroundColor: color }}
              />
              <button
                type="button"
                onClick={() => handleRemoveColor(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <p className="text-xs text-text-muted text-center mt-1">
                {color}
              </p>
            </motion.div>
          ))}
          {value.length === 0 && (
            <p className="text-sm text-text-muted italic">No colors selected</p>
          )}
        </div>
      </div>

      {/* Custom color picker */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 bg-surface-dark rounded-xl border border-border-subtle">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-brand-dark border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                disabled={value.length >= 6}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
