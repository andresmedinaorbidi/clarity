"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Palette, Type, Image as ImageIcon, Target } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface VisualBriefProps {
  state: WebsiteState;
}

// Color name to hex mapping (common colors)
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

// Font name to display mapping with actual font families
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

// Parse markdown brief to extract key information
function parseBrief(brief: string) {
  const sections: Record<string, string> = {};

  // Extract Executive Summary (more flexible regex, avoid JSON)
  const execMatch = brief.match(/##\s*Executive Summary\s*\n([\s\S]*?)(?=\n##|\n\n##|$)/i);
  if (execMatch) {
    sections.executiveSummary = sanitizeText(execMatch[1].trim());
  }

  // Extract Core Promise (more flexible, avoid JSON)
  const promiseMatch = brief.match(/###\s*Core Promise\s*\n([\s\S]*?)(?=\n\n|\n###|##|$)/i);
  if (promiseMatch) {
    sections.corePromise = sanitizeText(promiseMatch[1].trim().replace(/^\*\*|\*\*$/g, "").replace(/^\[|\]$/g, ""));
  }

  // Extract Primary Audience
  const audienceMatch = brief.match(/###\s*Primary Audience\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (audienceMatch) {
    sections.primaryAudience = audienceMatch[1].trim();
  }

  // Extract Demographics (more flexible, avoid JSON)
  const demoMatch = brief.match(/\*\*Demographics:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (demoMatch) {
    sections.demographics = sanitizeText(demoMatch[1].trim());
  }

  // Extract Psychographics (more flexible, avoid JSON)
  const psychoMatch = brief.match(/\*\*Psychographics:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (psychoMatch) {
    sections.psychographics = sanitizeText(psychoMatch[1].trim());
  }

  // Extract Personality Attributes
  const personalityMatch = brief.match(/###\s*Personality Attributes\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (personalityMatch) {
    sections.personality = personalityMatch[1].trim();
  }

  // Extract Primary Trait (more flexible, avoid JSON)
  const primaryTraitMatch = brief.match(/\*\*Primary Trait:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (primaryTraitMatch) {
    sections.primaryTrait = sanitizeText(primaryTraitMatch[1].trim());
  }

  // Extract Secondary Trait (more flexible, avoid JSON)
  const secondaryTraitMatch = brief.match(/\*\*Secondary Trait:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (secondaryTraitMatch) {
    sections.secondaryTrait = sanitizeText(secondaryTraitMatch[1].trim());
  }

  // Extract Communication Style (more flexible, avoid JSON)
  const commStyleMatch = brief.match(/\*\*Communication Style:\*\*\s*([^\n\[\{]+?)(?=\n|$|\*\*|\[|\{)/i);
  if (commStyleMatch) {
    sections.communicationStyle = sanitizeText(commStyleMatch[1].trim());
  }

  // Extract Recommended Style
  const styleMatch = brief.match(/###\s*Recommended Style\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (styleMatch) {
    sections.recommendedStyle = styleMatch[1].trim();
  }

  // Extract Color Palette
  const colorMatch = brief.match(/###\s*Color Palette\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (colorMatch) {
    sections.colorPalette = colorMatch[1].trim();
  }

  // Extract Typography
  const typoMatch = brief.match(/###\s*Typography Suggestions\s*\n([\s\S]*?)(?=\n###|##|$)/i);
  if (typoMatch) {
    sections.typography = typoMatch[1].trim();
  }

  return sections;
}

// Extract colors from text and return with hex codes
function extractColors(colorText: string, brandColors: string[]): Array<{ name: string; hex: string }> {
  const colors: Array<{ name: string; hex: string }> = [];

  // First, use brand_colors from state if available
  if (brandColors && brandColors.length > 0) {
    brandColors.forEach((color) => {
      const colorLower = color.toLowerCase().trim();
      // Check if it's already a hex code
      if (color.match(/^#[0-9a-fA-F]{6}$/)) {
        colors.push({ name: color, hex: color });
      } else {
        const hex = COLOR_MAP[colorLower] || generateHexFromName(color);
        colors.push({ name: color, hex });
      }
    });
  }

  // Also parse from brief text
  const colorLines = colorText.match(/- \*\*[^:]+:\*\*\s*\[?([^\]]+)\]?/g);
  if (colorLines) {
    colorLines.forEach((line) => {
      const match = line.match(/\[?([^\]]+)\]?/);
      if (match) {
        const colorDesc = match[1];
        // Try to extract color name and hex
        const hexMatch = colorDesc.match(/#[0-9a-fA-F]{6}/);
        if (hexMatch) {
          const name = colorDesc.replace(hexMatch[0], "").trim() || hexMatch[0];
          colors.push({ name, hex: hexMatch[0] });
        } else {
          // Try to find hex in the description
          const parts = colorDesc.split(/[+\-]/);
          parts.forEach((part) => {
            const trimmed = part.trim();
            if (trimmed) {
              const hex = COLOR_MAP[trimmed.toLowerCase()] || generateHexFromName(trimmed);
              colors.push({ name: trimmed, hex });
            }
          });
        }
      }
    });
  }

  // Remove duplicates
  const uniqueColors = Array.from(
    new Map(colors.map((c) => [c.name.toLowerCase(), c])).values()
  );

  return uniqueColors.length > 0 ? uniqueColors : [{ name: "Brand Primary", hex: "#beff50" }];
}

// Generate a hex color from a color name (simple approximation)
function generateHexFromName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  // Simple hash-based color generation
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

// Extract fonts from typography section
function extractFonts(typoText: string): Array<{ name: string; family: string; usage: string; category: string }> {
  const fonts: Array<{ name: string; family: string; usage: string; category: string }> = [];

  const fontLines = typoText.match(/- \*\*[^:]+:\*\*\s*\[?([^\]]+)\]?/g);
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

  return fonts.length > 0
    ? fonts
    : [{ name: "System", family: "system-ui, sans-serif", usage: "Headlines & Body", category: "Modern" }];
}

// Sanitize text to remove JSON structures, code blocks, and technical content
function sanitizeText(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove JSON objects (e.g., {"key": "value"})
  cleaned = cleaned.replace(/\{[^{}]*"([^"]+)":\s*"([^"]+)"[^{}]*\}/g, "");
  
  // Remove JSON arrays (e.g., ["item1", "item2"])
  cleaned = cleaned.replace(/\["([^"]+)",\s*"([^"]+)"[^\]]*\]/g, "");
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`[^`]+`/g, "");
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\w]*\n[\s\S]*?```/g, "");
  
  // Remove JSON-like structures with curly braces
  cleaned = cleaned.replace(/\{[^}]{20,}\}/g, "");
  
  // Remove array-like structures
  cleaned = cleaned.replace(/\[[^\]]{20,}\]/g, "");
  
  // Remove common JSON keys that might leak
  cleaned = cleaned.replace(/["']?(primary|secondary|characteristics|demographics|psychographics|trait|communication|style)["']?\s*[:=]\s*["']?/gi, "");
  
  // Remove quotes around extracted text if it's just a single quoted string
  cleaned = cleaned.replace(/^["']|["']$/g, "");
  
  // Remove trailing commas, brackets, braces
  cleaned = cleaned.replace(/[,}\]]+$/g, "");
  cleaned = cleaned.replace(/^[,\[{]+/g, "");
  
  // Remove multiple spaces and clean up
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // If the result looks like JSON (starts with { or [), return empty
  if (cleaned.match(/^[\{\[]/)) {
    return "";
  }
  
  return cleaned;
}

// Helper to extract from text with sanitization
function extractFromText(text: string | undefined, key: string): string | null {
  if (!text) return null;
  const match = new RegExp(`${key}[:\-]\\s*([^\\n]+)`, "i").exec(text);
  if (!match) return null;
  return sanitizeText(match[1]);
}

export default function VisualBrief({ state }: VisualBriefProps) {
  const parsed = useMemo(() => parseBrief(state.project_brief), [state.project_brief]);

  // Get core idea (prefer Core Promise, fallback to Executive Summary, fallback to value_proposition from meta)
  const coreIdea =
    parsed.corePromise ||
    parsed.executiveSummary?.split("\n")[0]?.replace(/^#+\s*/, "").trim() ||
    (state.project_meta?.value_proposition as string) ||
    "Building a powerful digital presence";

  // Get target audience info (try meta first, then parsed)
  const targetAudienceMeta = state.project_meta?.target_audience as string;
  const demographics = parsed.demographics || extractFromText(targetAudienceMeta, "Demographics") || "To be defined";
  const psychographics = parsed.psychographics || extractFromText(targetAudienceMeta, "Psychographics") || "Quality-focused customers";

  // Get brand personality (try meta first, then parsed)
  const brandVoiceMeta = state.project_meta?.brand_voice as string;
  const primaryTrait = parsed.primaryTrait || extractFromText(brandVoiceMeta, "Primary Trait") || "Professional";
  const secondaryTrait = parsed.secondaryTrait || extractFromText(brandVoiceMeta, "Secondary Trait") || "Approachable";
  const communicationStyle = parsed.communicationStyle || extractFromText(brandVoiceMeta, "Communication Style") || "Clear and confident";
  const visualStyle = parsed.recommendedStyle || state.design_style || "Modern and clean";

  // Extract colors
  const colors = extractColors(parsed.colorPalette || "", state.brand_colors || []);

  // Extract fonts
  const fonts = extractFonts(parsed.typography || "");

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      {/* Core Idea */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Target className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-text-primary">Core Idea</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          <p className="text-xl font-normal text-text-primary leading-relaxed max-w-3xl">
            {coreIdea}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-12">
        {/* Target Audience */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Users className="text-brand-secondary" size={18} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">Target Audience</h3>
          </div>
          <div className="border-t border-brand-border pt-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Demographics</p>
              <p className="text-sm font-normal text-text-primary leading-relaxed">{demographics}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Psychographics</p>
              <p className="text-sm font-normal text-text-secondary leading-relaxed">{psychographics}</p>
            </div>
          </div>
        </motion.div>

        {/* Brand Personality */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Sparkles className="text-brand-secondary" size={18} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">Brand Personality</h3>
          </div>
          <div className="border-t border-brand-border pt-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Primary</p>
              <p className="text-sm font-normal text-text-primary">{primaryTrait}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Secondary</p>
              <p className="text-sm font-normal text-text-secondary">{secondaryTrait}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Communication</p>
              <p className="text-sm font-normal text-text-secondary">{communicationStyle}</p>
            </div>
            <div className="pt-4 border-t border-brand-border/50">
              <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Visual Direction</p>
              <p className="text-sm font-normal text-text-secondary">{visualStyle}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Color Palette */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <Palette className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Color Palette</h3>
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

      {/* Typography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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

      {/* Style Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
            <ImageIcon className="text-brand-secondary" size={18} />
          </div>
          <h3 className="text-sm font-medium text-text-primary">Visual Direction</h3>
        </div>
        <div className="border-t border-brand-border pt-6">
          {/* Simple Mockup */}
          <div className="bg-white border-2 border-brand-border rounded-xl overflow-hidden shadow-lg">
          {/* Mockup Header */}
          <div
            className="h-16 flex items-center justify-between px-6"
            style={{ backgroundColor: colors[0]?.hex || "#beff50" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg" />
              <span className="text-white font-bold text-sm">{state.project_name || "Brand"}</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <div
                className="h-8 rounded-lg"
                style={{
                  backgroundColor: colors[0]?.hex || "#beff50",
                  width: "60%",
                  opacity: 0.9,
                }}
              />
              <div className="h-4 bg-brand-border rounded w-3/4" />
              <div className="h-4 bg-brand-border rounded w-2/3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div
                    className="h-24 rounded-lg"
                    style={{
                      backgroundColor: colors[i]?.hex || colors[0]?.hex || "#e5e7eb",
                      opacity: 0.7,
                    }}
                  />
                  <div className="h-3 bg-brand-border rounded w-full" />
                  <div className="h-3 bg-brand-border rounded w-2/3" />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div
                className="px-6 py-3 rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: colors[0]?.hex || "#beff50" }}
              >
                Primary CTA
              </div>
              <div className="px-6 py-3 rounded-lg border-2 border-brand-border font-bold text-sm">
                Secondary
              </div>
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
