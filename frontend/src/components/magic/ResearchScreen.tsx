"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Database, Globe, User, Check, Palette, Type } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface ResearchScreenProps {
  state: WebsiteState;
  onApprove: () => void;
  loading?: boolean;
}

// Color name to hex mapping (from VisualBrief)
const COLOR_MAP: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  navy: "#1e3a8a",
  blue: "#3b82f6",
  "electric blue": "#0066ff",
  green: "#10b981",
  "neon green": "#39ff14",
  "fresh green": "#22c55e",
  orange: "#f97316",
  "warm orange": "#fb923c",
  red: "#ef4444",
  "deep red": "#dc2626",
  purple: "#9333ea",
  gold: "#fbbf24",
  cream: "#fef3c7",
  gray: "#6b7280",
  "dark gray": "#374151",
  "charcoal gray": "#1f2937",
  "soft teal": "#14b8a6",
  "calming blue": "#3b82f6",
  yellow: "#eab308",
  brown: "#92400e",
  "dark wood brown": "#78350f",
};

// Font name to display mapping (from VisualBrief)
const FONT_DISPLAY: Record<string, { name: string; family: string; category: string }> = {
  "sans-serif": { name: "System Sans", family: "system-ui, sans-serif", category: "Modern" },
  serif: { name: "System Serif", family: "Georgia, serif", category: "Classic" },
  mono: { name: "System Mono", family: "Monaco, monospace", category: "Technical" },
  inter: { name: "Inter", family: "'Inter', sans-serif", category: "Modern" },
  roboto: { name: "Roboto", family: "'Roboto', sans-serif", category: "Clean" },
  "open sans": { name: "Open Sans", family: "'Open Sans', sans-serif", category: "Friendly" },
  poppins: { name: "Poppins", family: "'Poppins', sans-serif", category: "Bold" },
  montserrat: { name: "Montserrat", family: "'Montserrat', sans-serif", category: "Geometric" },
  playfair: { name: "Playfair Display", family: "'Playfair Display', serif", category: "Elegant" },
  lora: { name: "Lora", family: "'Lora', serif", category: "Serif" },
};

// Extract colors from brand_colors and project_brief
function extractColors(brandColors: string[], projectBrief: string): Array<{ name: string; hex: string }> {
  const colors: Array<{ name: string; hex: string }> = [];

  // First, use brand_colors from state
  if (brandColors && brandColors.length > 0) {
    brandColors.forEach((color) => {
      const colorLower = color.toLowerCase().trim();
      if (color.match(/^#[0-9a-fA-F]{6}$/)) {
        colors.push({ name: color, hex: color });
      } else {
        const hex = COLOR_MAP[colorLower] || generateHexFromName(color);
        colors.push({ name: color, hex });
      }
    });
  }

  // Also parse from brief text if available
  if (projectBrief) {
    const colorMatch = projectBrief.match(/###\s*Color Palette\s*\n([\s\S]*?)(?=\n###|##|$)/i);
    if (colorMatch) {
      const colorLines = colorMatch[1].match(/- \*\*[^:]+:\*\*\s*\[?([^\]]+)\]?/g);
      if (colorLines) {
        colorLines.forEach((line) => {
          const match = line.match(/\[?([^\]]+)\]?/);
          if (match) {
            const colorDesc = match[1];
            const hexMatch = colorDesc.match(/#[0-9a-fA-F]{6}/);
            if (hexMatch) {
              const name = colorDesc.replace(hexMatch[0], "").trim() || hexMatch[0];
              colors.push({ name, hex: hexMatch[0] });
            }
          }
        });
      }
    }
  }

  // Remove duplicates
  const uniqueColors = Array.from(
    new Map(colors.map((c) => [c.name.toLowerCase(), c])).values()
  );

  return uniqueColors.length > 0 ? uniqueColors : [{ name: "Brand Primary", hex: "#beff50" }];
}

// Generate hex from color name
function generateHexFromName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

// Extract fonts from project_brief
function extractFonts(projectBrief: string): Array<{ name: string; family: string; usage: string; category: string }> {
  const fonts: Array<{ name: string; family: string; usage: string; category: string }> = [];

  if (!projectBrief) {
    return [{ name: "System", family: "system-ui, sans-serif", usage: "Headlines & Body", category: "Modern" }];
  }

  const typoMatch = projectBrief.match(/###\s*Typography Suggestions\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (typoMatch) {
    const fontLines = typoMatch[1].match(/- \*\*[^:]+:\*\*\s*\[?([^\]]+)\]?/g);
    if (fontLines) {
      fontLines.forEach((line) => {
        const usageMatch = line.match(/\*\*([^:]+):\*\*/);
        const fontMatch = line.match(/\[?([^\]]+)\]?/);
        if (usageMatch && fontMatch) {
          const usage = usageMatch[1].trim();
          const fontDesc = fontMatch[1].toLowerCase();
          const fontName = Object.keys(FONT_DISPLAY).find((key) => fontDesc.includes(key));
          const fontInfo = fontName
            ? FONT_DISPLAY[fontName]
            : { name: fontDesc.split(" ")[0] || "System", family: "system-ui, sans-serif", category: "Modern" };
          fonts.push({ name: fontInfo.name, family: fontInfo.family, usage, category: fontInfo.category });
        }
      });
    }
  }

  return fonts.length > 0
    ? fonts
    : [{ name: "System", family: "system-ui, sans-serif", usage: "Headlines & Body", category: "Modern" }];
}

export default function ResearchScreen({ state, onApprove, loading = false }: ResearchScreenProps) {
  const inferredFields = (state.project_meta?.inferred_fields as string[]) || [];
  const crmData = state.crm_data || {};
  const researchData = (state.additional_context?.research_data as Record<string, unknown>) || {};
  const hasCrmData = Object.keys(crmData).length > 0;
  const hasResearchData = Object.keys(researchData).length > 0;

  // Determine data source for each field
  const getFieldSource = (fieldName: string): "user" | "crm" | "scraped" | "inferred" => {
    if (inferredFields.includes(fieldName)) {
      if (fieldName === "industry" && crmData.industry) return "crm";
      if (fieldName === "brand_colors" && crmData.colors) return "crm";
      if (researchData[fieldName]) return "scraped";
      return "inferred";
    }
    return "user";
  };

  // Extract colors and fonts
  const colors = useMemo(
    () => extractColors(state.brand_colors || [], state.project_brief || ""),
    [state.brand_colors, state.project_brief]
  );

  const fonts = useMemo(
    () => extractFonts(state.project_brief || ""),
    [state.project_brief]
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "user":
        return <User size={12} className="text-text-secondary" />;
      case "crm":
        return <Database size={12} className="text-blue-500" />;
      case "scraped":
        return <Globe size={12} className="text-green-500" />;
      case "inferred":
        return <Sparkles size={12} className="text-brand-primary" />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "user":
        return "You provided";
      case "crm":
        return "From CRM";
      case "scraped":
        return "Scraped";
      case "inferred":
        return "AI inferred";
      default:
        return "";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "user":
        return "bg-brand-surface border-brand-border";
      case "crm":
        return "bg-blue-50 border-blue-200";
      case "scraped":
        return "bg-green-50 border-green-200";
      case "inferred":
        return "bg-brand-primary/5 border-brand-primary/20";
      default:
        return "bg-brand-surface border-brand-border";
    }
  };

  const fields = [
    {
      key: "project_name",
      label: "Project Name",
      value: state.project_name,
      source: getFieldSource("project_name"),
    },
    {
      key: "industry",
      label: "Category",
      value: state.industry,
      source: getFieldSource("industry"),
    },
    {
      key: "design_style",
      label: "Design Style",
      value: state.design_style,
      source: getFieldSource("design_style"),
    },
  ].filter((field) => field.value);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Sparkles className="text-brand-secondary" size={18} />
          </div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
            We Get You
          </h2>
        </div>
        <div className="border-t border-brand-border pt-6">
          <p className="text-sm font-normal text-text-secondary leading-relaxed max-w-2xl">
            We've researched your business, analyzed your industry, and understood your vision. Here's what we've gathered:
          </p>
        </div>
      </motion.div>

      {/* Basic Info Grid */}
      {fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-text-primary">Project Details</h3>
          </div>
          <div className="border-t border-brand-border pt-6">
            <div className="grid grid-cols-3 gap-4">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={`p-4 border rounded-xl transition-all ${getSourceColor(field.source)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase font-medium text-text-muted">{field.label}</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/50 rounded-full">
                      {getSourceIcon(field.source)}
                      <span className="text-[9px] font-semibold text-text-secondary">
                        {getSourceLabel(field.source)}
                      </span>
                    </div>
                  </div>
                  <p className="text-base font-medium text-text-primary">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Color Palette */}
      {colors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Palette className="text-brand-secondary" size={18} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">Brand Colors</h3>
          </div>
          <div className="border-t border-brand-border pt-6">
            <div className="flex flex-wrap gap-6">
              {colors.map((color, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col items-center"
                >
                  <div
                    className="w-20 h-20 rounded-lg border border-brand-border/50 transition-all group-hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} - ${color.hex.toUpperCase()}`}
                  />
                  <div className="mt-3 text-center">
                    <p className="text-xs font-normal text-text-primary">{color.name}</p>
                    <p className="text-[10px] font-mono text-text-secondary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {color.hex.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Typography */}
      {fonts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Type className="text-brand-secondary" size={18} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">Typography</h3>
          </div>
          <div className="border-t border-brand-border pt-6">
            <div className="space-y-6">
              {fonts.map((font, i) => (
                <div key={i} className={i > 0 ? "pt-6 border-t border-brand-border/50" : ""}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-base font-medium text-text-primary" style={{ fontFamily: font.family }}>
                        {font.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{font.category}</p>
                    </div>
                    <span className="text-xs font-normal text-text-secondary px-2 py-1">
                      {font.usage}
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <p className="text-lg font-normal" style={{ fontFamily: font.family }}>
                      The quick brown fox jumps
                    </p>
                    <p className="text-sm font-normal text-text-secondary" style={{ fontFamily: font.family }}>
                      The quick brown fox jumps over the lazy dog. 1234567890
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Sources Summary */}
      {(hasCrmData || hasResearchData || inferredFields.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-text-primary">Research Sources</h3>
          </div>
          <div className="border-t border-brand-border pt-6">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <User size={12} />
                <span>You provided</span>
              </div>
              {hasCrmData && (
                <div className="flex items-center gap-1.5">
                  <Database size={12} className="text-blue-500" />
                  <span>From CRM</span>
                </div>
              )}
              {hasResearchData && (
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-green-500" />
                  <span>Scraped</span>
                </div>
              )}
              {inferredFields.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-primary" />
                  <span>AI inferred</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Approval Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4"
      >
        <button
          onClick={onApprove}
          disabled={loading || !state.project_name || state.missing_info.length > 0}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm
            transition-all
            ${
              loading || !state.project_name || state.missing_info.length > 0
                ? "bg-brand-primary/20 text-brand-primary/50 cursor-not-allowed"
                : "bg-text-primary hover:bg-text-primary/90 text-white shadow-md hover:shadow-lg"
            }
          `}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Looks Good - Continue to Blueprint</span>
            </>
          )}
        </button>
        {state.missing_info.length > 0 && (
          <p className="text-xs text-text-muted text-center mt-2">
            Please provide: {state.missing_info.join(", ")}
          </p>
        )}
      </motion.div>
    </div>
  );
}
