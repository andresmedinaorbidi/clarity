/**
 * Intake Question Definitions (PR-07)
 *
 * Defines the guided intake wizard flow.
 * Each question maps to a field in WebsiteState or project_meta.
 */

export type QuestionKind =
  | "text"
  | "single"
  | "multi"
  | "colors"
  | "style"
  | "fonts"
  | "pages";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface IntakeQuestion {
  id: string;
  field: string;
  title: string;
  description?: string;
  kind: QuestionKind;
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string;
  /** For top-level WebsiteState fields (project_name, industry, design_style, brand_colors) */
  isTopLevel?: boolean;
  /** For additional_context fields (draft_pages) */
  isAdditionalContext?: boolean;
}

/**
 * Curated industry options
 */
export const INDUSTRY_OPTIONS: QuestionOption[] = [
  { value: "technology", label: "Technology", description: "Software, SaaS, IT services" },
  { value: "ecommerce", label: "E-commerce", description: "Online retail, marketplaces" },
  { value: "healthcare", label: "Healthcare", description: "Medical, wellness, fitness" },
  { value: "finance", label: "Finance", description: "Banking, fintech, insurance" },
  { value: "education", label: "Education", description: "Schools, courses, e-learning" },
  { value: "restaurant", label: "Restaurant", description: "Food service, cafes, bars" },
  { value: "real_estate", label: "Real Estate", description: "Properties, agencies" },
  { value: "professional_services", label: "Professional Services", description: "Legal, consulting, agencies" },
  { value: "creative", label: "Creative", description: "Design, photography, art" },
  { value: "nonprofit", label: "Nonprofit", description: "Charities, foundations" },
  { value: "other", label: "Other", description: "Something else" },
];

/**
 * Goal/purpose options
 */
export const GOAL_OPTIONS: QuestionOption[] = [
  { value: "lead_generation", label: "Generate Leads", description: "Capture contact info and inquiries" },
  { value: "sell_products", label: "Sell Products", description: "E-commerce and online sales" },
  { value: "build_brand", label: "Build Brand", description: "Establish presence and credibility" },
  { value: "inform", label: "Inform Visitors", description: "Share information and resources" },
  { value: "portfolio", label: "Showcase Work", description: "Display projects and case studies" },
  { value: "booking", label: "Take Bookings", description: "Schedule appointments or reservations" },
];

/**
 * Design style options with visual descriptions
 */
export const STYLE_OPTIONS: QuestionOption[] = [
  { value: "minimal", label: "Minimal", description: "Clean, simple, lots of whitespace", icon: "minimal" },
  { value: "modern", label: "Modern", description: "Contemporary, bold typography", icon: "modern" },
  { value: "elegant", label: "Elegant", description: "Refined, sophisticated, premium feel", icon: "elegant" },
  { value: "playful", label: "Playful", description: "Fun, colorful, friendly", icon: "playful" },
  { value: "corporate", label: "Corporate", description: "Professional, trustworthy, formal", icon: "corporate" },
  { value: "bold", label: "Bold", description: "Strong contrasts, impactful", icon: "bold" },
];

/**
 * Tone of voice options
 */
export const TONE_OPTIONS: QuestionOption[] = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
  { value: "authoritative", label: "Authoritative", description: "Expert and confident" },
  { value: "playful", label: "Playful", description: "Fun and lighthearted" },
  { value: "inspirational", label: "Inspirational", description: "Motivating and uplifting" },
];

/**
 * Font pairing options
 */
export const FONT_OPTIONS: QuestionOption[] = [
  { value: "inter_playfair", label: "Inter + Playfair", description: "Modern sans + classic serif" },
  { value: "poppins_lora", label: "Poppins + Lora", description: "Geometric + elegant" },
  { value: "roboto_roboto_slab", label: "Roboto + Roboto Slab", description: "Clean + structured" },
  { value: "montserrat_merriweather", label: "Montserrat + Merriweather", description: "Bold + readable" },
  { value: "open_sans_oswald", label: "Open Sans + Oswald", description: "Friendly + impactful" },
  { value: "system", label: "System Fonts", description: "Fast loading, native feel" },
];

/**
 * Common page types
 */
export const PAGE_OPTIONS: QuestionOption[] = [
  { value: "home", label: "Home", description: "Main landing page" },
  { value: "about", label: "About", description: "Company/personal story" },
  { value: "services", label: "Services", description: "What you offer" },
  { value: "products", label: "Products", description: "Product catalog" },
  { value: "portfolio", label: "Portfolio", description: "Work samples" },
  { value: "blog", label: "Blog", description: "Articles and updates" },
  { value: "contact", label: "Contact", description: "Get in touch" },
  { value: "pricing", label: "Pricing", description: "Plans and costs" },
  { value: "faq", label: "FAQ", description: "Common questions" },
  { value: "testimonials", label: "Testimonials", description: "Customer reviews" },
];

/**
 * Preset color palettes
 */
export const COLOR_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Ocean", colors: ["#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"] },
  { name: "Forest", colors: ["#2D6A4F", "#40916C", "#74C69D", "#B7E4C7"] },
  { name: "Sunset", colors: ["#F94144", "#F3722C", "#F8961E", "#F9C74F"] },
  { name: "Lavender", colors: ["#7209B7", "#A663CC", "#D4A5FF", "#F2E5FF"] },
  { name: "Midnight", colors: ["#1A1A2E", "#16213E", "#0F3460", "#E94560"] },
  { name: "Monochrome", colors: ["#111111", "#333333", "#666666", "#FFFFFF"] },
  { name: "Earth", colors: ["#5C4033", "#8B6914", "#C4A35A", "#E8D5B7"] },
  { name: "Tech", colors: ["#6366F1", "#8B5CF6", "#A855F7", "#F0F0F0"] },
];

/**
 * The ordered intake question sequence
 */
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "project_name",
    field: "project_name",
    title: "What's your business or project called?",
    description: "This will be your website's identity",
    kind: "text",
    placeholder: "e.g., Acme Corp, Jane's Photography",
    required: true,
    isTopLevel: true,
  },
  {
    id: "industry",
    field: "industry",
    title: "What industry are you in?",
    description: "Helps us tailor the design and content",
    kind: "single",
    options: INDUSTRY_OPTIONS,
    required: true,
    isTopLevel: true,
  },
  {
    id: "goal",
    field: "goal",
    title: "What's the main goal for your website?",
    description: "We'll optimize the structure for this",
    kind: "single",
    options: GOAL_OPTIONS,
    required: false,
  },
  {
    id: "design_style",
    field: "design_style",
    title: "Choose a design style",
    description: "Sets the visual direction",
    kind: "style",
    options: STYLE_OPTIONS,
    required: true,
    isTopLevel: true,
  },
  {
    id: "tone",
    field: "tone",
    title: "What tone should your content have?",
    description: "Guides the copywriting voice",
    kind: "single",
    options: TONE_OPTIONS,
    required: false,
  },
  {
    id: "brand_colors",
    field: "brand_colors",
    title: "Pick your brand colors",
    description: "Choose a palette or create your own",
    kind: "colors",
    required: true,
    isTopLevel: true,
  },
  {
    id: "font_pair",
    field: "font_pair",
    title: "Choose a font pairing",
    description: "Typography for headings and body text",
    kind: "fonts",
    options: FONT_OPTIONS,
    required: false,
  },
  {
    id: "draft_pages",
    field: "draft_pages",
    title: "Which pages do you need?",
    description: "Select the pages for your website",
    kind: "pages",
    options: PAGE_OPTIONS,
    required: false,
    isAdditionalContext: true,
  },
];

/**
 * Get the default value for a field from state
 * Priority: user_overrides > inferred > direct state value > empty
 */
export function getFieldValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  field: string,
  isTopLevel?: boolean,
  isAdditionalContext?: boolean
): unknown {
  const overrides = state.project_meta?.user_overrides ?? {};
  const inferred = state.project_meta?.inferred ?? {};

  // Check overrides first (user intent)
  if (field in overrides) {
    return overrides[field];
  }

  // Check inferred values
  if (field in inferred && inferred[field]?.value !== undefined) {
    return inferred[field].value;
  }

  // Check additional_context for specific fields
  if (isAdditionalContext && state.additional_context && field in state.additional_context) {
    return state.additional_context[field];
  }

  // Check top-level state for specific fields
  if (isTopLevel && field in state) {
    return state[field];
  }

  return undefined;
}

/**
 * PR-07.1: Priority option metadata for UI highlighting
 */
export interface PriorityOptionMeta {
  value: string;
  type: "user" | "inferred";
  label: string; // "From your description" or "Recommended"
}

/**
 * PR-07.1: Result of building priority options
 */
export interface PriorityOptionsResult {
  options: QuestionOption[];
  priorityMeta: PriorityOptionMeta[];
  selectedValue: string | undefined;
}

/**
 * PR-07.1: Build options list with user-provided and inferred values injected at top
 *
 * @param defaultOptions - The default options for this question
 * @param userValue - User-provided value from overrides (highest priority)
 * @param inferredValue - AI-inferred value (secondary priority)
 * @param currentValue - Currently selected value
 * @returns Options array with priority values injected, plus metadata for UI
 */
export function buildPriorityOptions(
  defaultOptions: QuestionOption[],
  userValue: string | undefined,
  inferredValue: string | undefined,
  currentValue: unknown
): PriorityOptionsResult {
  const result: QuestionOption[] = [];
  const priorityMeta: PriorityOptionMeta[] = [];
  const existingValues = new Set(defaultOptions.map(o => o.value.toLowerCase()));

  // 1. Inject user-provided value at top if not in defaults
  if (userValue && !existingValues.has(userValue.toLowerCase())) {
    result.push({
      value: userValue,
      label: userValue,
      description: "Your selection",
    });
    priorityMeta.push({ value: userValue, type: "user", label: "From your description" });
    existingValues.add(userValue.toLowerCase());
  } else if (userValue) {
    // Mark existing option as user-provided
    priorityMeta.push({ value: userValue, type: "user", label: "From your description" });
  }

  // 2. Inject inferred value at second position if different from user and not in defaults
  if (inferredValue && inferredValue !== userValue && !existingValues.has(inferredValue.toLowerCase())) {
    result.push({
      value: inferredValue,
      label: inferredValue,
      description: "AI recommendation",
    });
    priorityMeta.push({ value: inferredValue, type: "inferred", label: "Recommended" });
    existingValues.add(inferredValue.toLowerCase());
  } else if (inferredValue && inferredValue !== userValue) {
    // Mark existing option as inferred
    priorityMeta.push({ value: inferredValue, type: "inferred", label: "Recommended" });
  }

  // 3. Add all default options
  result.push(...defaultOptions);

  // 4. Determine selected value: user > inferred > currentValue
  let selectedValue: string | undefined;
  if (userValue) {
    selectedValue = userValue;
  } else if (inferredValue) {
    selectedValue = inferredValue;
  } else if (typeof currentValue === "string") {
    selectedValue = currentValue;
  }

  return { options: result, priorityMeta, selectedValue };
}

/**
 * PR-07.1: Check if a field has a user-provided value (should skip question)
 */
export function hasUserProvidedValue(
  state: {
    project_meta?: { user_overrides?: Record<string, unknown> };
  },
  field: string
): boolean {
  const overrides = state.project_meta?.user_overrides ?? {};
  const value = overrides[field];
  return value !== undefined && value !== null && value !== "";
}

/**
 * PR-07.1: Get inferred value with metadata for a field
 */
export function getInferredValueWithMeta(
  state: {
    project_meta?: { inferred?: Record<string, { value: unknown; confidence?: number; source?: string; rationale?: string }> };
  },
  field: string
): { value: unknown; confidence?: number; source?: string; rationale?: string } | undefined {
  const inferredRecord = state.project_meta?.inferred;
  if (inferredRecord && field in inferredRecord && inferredRecord[field]?.value !== undefined) {
    return inferredRecord[field];
  }
  return undefined;
}

/**
 * PR-07.1: Filter questions based on state (skip questions with user-provided values)
 */
export function getActiveQuestions(
  questions: IntakeQuestion[],
  state: {
    project_meta?: { user_overrides?: Record<string, unknown>; inferred?: Record<string, { value: unknown }> };
  }
): IntakeQuestion[] {
  return questions.filter(q => {
    // Skip business name question if user already provided it
    if (q.field === "project_name" && hasUserProvidedValue(state, "project_name")) {
      return false;
    }
    return true;
  });
}

/**
 * Get the data source for a field (user, crm, scraped, inferred)
 * Priority: user_overrides > crm_data > scraped > inferred
 */
export function getFieldSource(
  fieldName: string,
  state: {
    project_meta?: {
      user_overrides?: Record<string, unknown>;
      inferred?: Record<string, { value: unknown; source?: string }>;
    };
    crm_data?: Record<string, unknown>;
    additional_context?: {
      research_data?: Record<string, unknown>;
      scrape_summary?: Record<string, unknown>;
    };
  }
): "user" | "crm" | "scraped" | "inferred" {
  // 1. Check user overrides first (highest priority)
  const userOverrides = state.project_meta?.user_overrides ?? {};
  if (fieldName in userOverrides && userOverrides[fieldName] !== undefined && userOverrides[fieldName] !== null && userOverrides[fieldName] !== "") {
    return "user";
  }

  // 2. Check CRM data
  const crmData = state.crm_data ?? {};
  if (fieldName === "industry" && crmData.industry) return "crm";
  if (fieldName === "brand_colors" && crmData.colors) return "crm";
  if (fieldName === "project_name" && crmData.name) return "crm";

  // 3. Check scraped/research data
  const researchData = state.additional_context?.research_data ?? {};
  const scrapeSummary = state.additional_context?.scrape_summary ?? {};
  if (researchData[fieldName] || scrapeSummary[fieldName]) {
    return "scraped";
  }

  // 4. Check inferred (with source tracking)
  const inferred = state.project_meta?.inferred ?? {};
  if (fieldName in inferred) {
    const inferredData = inferred[fieldName];
    if (inferredData && typeof inferredData === "object" && "value" in inferredData) {
      const source = inferredData.source;
      if (source === "scraped" || source === "hybrid") {
        return "scraped";
      }
      return "inferred";
    }
  }

  // Default: if field has a value but no source tracking, assume inferred
  return "inferred";
}
