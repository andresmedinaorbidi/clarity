"use client";
/**
 * FieldCard - Base card wrapper for intake fields
 */

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Check, X, LucideIcon } from "lucide-react";
import SourceBadge, { SourceType } from "./SourceBadge";

interface FieldCardProps {
  label: string;
  value: ReactNode;
  source: SourceType;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  required?: boolean;
  emptyPlaceholder?: string;
  children?: ReactNode; // Picker content when editing
  icon?: LucideIcon;
  iconColor?: string; // Optional custom color for icon
}

export default function FieldCard({
  label,
  value,
  source,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  loading = false,
  required = false,
  emptyPlaceholder = "Not set",
  children,
  icon: Icon,
  iconColor,
}: FieldCardProps) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: iconColor ? `${iconColor}15` : 'rgba(190, 255, 80, 0.1)',
                color: iconColor || '#beff50'
              }}
            >
              <Icon size={18} style={{ color: iconColor || '#beff50' }} />
            </div>
          )}
          <h3 className="text-base font-semibold text-text-primary">{label}</h3>
          {required && (
            <span className="text-xs text-text-muted">*</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && <SourceBadge source={source} />}
          {!isEditing && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-text-primary"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-red-600 disabled:opacity-50"
                title="Cancel"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-text-muted hover:text-green-600 disabled:opacity-50"
                title="Save"
              >
                <Check size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="w-6 h-6 animate-spin text-brand-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            ) : (
              children
            )}
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[2rem]"
          >
            {hasValue ? (
              <div className="text-text-primary">{value}</div>
            ) : (
              <p className="text-text-muted italic text-sm">{emptyPlaceholder}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
