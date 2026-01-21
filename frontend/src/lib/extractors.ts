// frontend/src/lib/extractors.ts
/**
 * Shared extraction utilities for colors and fonts
 * Used by ResearchScreen, VisualBrief, and other components
 */

// Color name to hex mapping
export const COLOR_MAP: Record<string, string> = {
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

// Font name to display mapping
export const FONT_DISPLAY: Record<string, { name: string; family: string; category: string }> = {
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

export interface ColorInfo {
  name: string;
  hex: string;
}

export interface FontInfo {
  name: string;
  family: string;
  usage: string;
  category: string;
}

/**
 * Generate hex color from color name
 */
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

/**
 * Extract colors from brand_colors array and project_brief markdown
 */
export function extractColors(brandColors: string[], projectBrief: string): ColorInfo[] {
  const colors: ColorInfo[] = [];

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

/**
 * Extract fonts from project_brief markdown
 */
export function extractFonts(projectBrief: string): FontInfo[] {
  const fonts: FontInfo[] = [];

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
