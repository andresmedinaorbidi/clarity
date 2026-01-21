/**
 * Constants for the Clarity application.
 * 
 * Centralizes all magic strings and markers used throughout the frontend.
 */

// ============================================================================
// STEP NAMES
// ============================================================================

export enum StepName {
  INTAKE = "intake",
  RESEARCH = "research",
  STRATEGY = "strategy",
  UX = "ux",
  PLANNING = "planning",
  SEO = "seo",
  COPYWRITING = "copywriting",
  PRD = "prd",
  BUILDING = "building",
}

// List of all step names for iteration
export const ALL_STEPS: StepName[] = Object.values(StepName);

// ============================================================================
// STATE UPDATE MARKERS
// ============================================================================

// Marker used to delimit state updates in streaming responses
export const STATE_UPDATE_MARKER = "|||STATE_UPDATE|||";

// ============================================================================
// GATE ACTION MARKERS
// ============================================================================

// Pattern for gate action markers: [GATE_ACTION: GATE_NAME]
export const GATE_ACTION_PATTERN = /\[GATE_ACTION:\s*([^\]]+)\]/;

// Gate names (mapped from step names for UI consistency)
export const GATE_INTAKE = "INTAKE_&_AUDIT";
export const GATE_BLUEPRINT = "BLUEPRINT"; // Maps from "planning" step
export const GATE_MARKETING = "MARKETING"; // Maps from "copywriting" step

// ============================================================================
// SCREEN TYPES
// ============================================================================

export type ScreenTab = "research" | "blueprint" | "preview";
export type ArtifactTab = "brief" | "sitemap" | "marketing" | "preview" | "prd";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the gate name for a given step ID.
 * 
 * @param stepId - The step ID (e.g., "planning", "intake")
 * @param skillName - Optional skill name for fallback
 * @returns Gate name string (e.g., "BLUEPRINT", "INTAKE_&_AUDIT")
 */
export function getGateNameForStep(stepId: string, skillName: string = ""): string {
  if (stepId === StepName.PLANNING) {
    return GATE_BLUEPRINT;
  } else if (stepId === StepName.INTAKE) {
    return GATE_INTAKE;
  } else if (stepId === StepName.COPYWRITING) {
    return GATE_MARKETING;
  } else {
    // Fallback: convert skill name to uppercase with underscores
    return skillName ? skillName.toUpperCase().replace(/\s+/g, "_") : "UNKNOWN";
  }
}
