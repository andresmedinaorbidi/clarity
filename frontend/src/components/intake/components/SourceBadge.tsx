"use client";
/**
 * SourceBadge - Displays data source indicator (user, CRM, scraped, inferred)
 */

import React from "react";
import { User, Database, Globe, Sparkles } from "lucide-react";

export type SourceType = "user" | "crm" | "scraped" | "inferred";

interface SourceBadgeProps {
  source: SourceType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function SourceBadge({
  source,
  size = "sm",
  showLabel = false,
}: SourceBadgeProps) {
  const getSourceConfig = () => {
    switch (source) {
      case "user":
        return {
          icon: User,
          label: "You provided",
          color: "text-text-secondary",
          bgColor: "bg-brand-surface",
          borderColor: "border-brand-border",
        };
      case "crm":
        return {
          icon: Database,
          label: "From CRM",
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "scraped":
        return {
          icon: Globe,
          label: "Scraped",
          color: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "inferred":
        return {
          icon: Sparkles,
          label: "AI inferred",
          color: "text-brand-accent",
          bgColor: "bg-brand-accent/5",
          borderColor: "border-brand-accent/20",
        };
    }
  };

  const config = getSourceConfig();
  const Icon = config.icon;
  const iconSize = size === "sm" ? 12 : 14;

  if (showLabel) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${config.bgColor} ${config.borderColor}`}
      >
        <Icon size={iconSize} className={config.color} />
        <span className={`text-xs ${config.color} font-medium`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.bgColor} border ${config.borderColor}`}
      title={config.label}
    >
      <Icon size={iconSize} className={config.color} />
    </div>
  );
}
