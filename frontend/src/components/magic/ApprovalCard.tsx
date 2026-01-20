"use client";
import React, { useState } from "react";
import { Check, MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ApprovalCardProps {
  gateType: string;
  onApprove: () => void;
  onRequestChanges: () => void;
  disabled?: boolean;
}

// Map gate types to user-friendly titles
function getGateTitle(gateType: string): string {
  const titleMap: Record<string, string> = {
    PROJECT_BRIEF: "Project Brief Approval",
    SITEMAP_ARCHITECT: "Sitemap Approval",
    COPYWRITER: "Marketing Content Approval",
    "INTAKE_&_AUDIT": "Intake Approval",
  };

  // Fallback: convert skill names to readable format
  if (titleMap[gateType]) {
    return titleMap[gateType];
  }

  // Generic fallback: convert "SITEMAP_ARCHITECT" to "Sitemap Architect Approval"
  // Handle special characters like & by replacing them
  return gateType
    .replace(/_/g, " ")
    .replace(/&/g, "&")
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ") + " Approval";
}

export default function ApprovalCard({
  gateType,
  onApprove,
  onRequestChanges,
  disabled = false,
}: ApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (disabled || isProcessing) return;
    setIsProcessing(true);
    onApprove();
    // Keep processing state for visual feedback
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const handleRequestChanges = () => {
    if (disabled || isProcessing) return;
    onRequestChanges();
  };

  const title = getGateTitle(gateType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 max-w-[85%] bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border-2 border-brand-primary/30 rounded-2xl p-5 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
          <Check className="text-brand-primary" size={18} />
        </div>
        <h3 className="text-sm font-bold text-brand-primary">{title} Needed</h3>
      </div>

      <p className="text-xs text-text-secondary mb-4 leading-relaxed">
        Please review the content above. If everything looks good, approve to continue. If you'd like changes, request them below.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={disabled || isProcessing}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm
            transition-all
            ${
              disabled || isProcessing
                ? "bg-brand-primary/20 text-brand-primary/50 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Approve & Continue</span>
            </>
          )}
        </button>

        <button
          onClick={handleRequestChanges}
          disabled={disabled || isProcessing}
          className={`
            flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm
            transition-all border-2
            ${
              disabled || isProcessing
                ? "border-brand-border text-text-muted cursor-not-allowed"
                : "border-brand-border text-text-primary hover:border-brand-primary hover:bg-brand-surface"
            }
          `}
        >
          <MessageSquare size={14} />
          <span>Request Changes</span>
        </button>
      </div>
    </motion.div>
  );
}
