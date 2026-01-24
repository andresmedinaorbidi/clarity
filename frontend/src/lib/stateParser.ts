/**
 * State parsing utilities for handling streaming responses and state updates.
 * 
 * Pure functions for parsing state updates, detecting artifact markers, and cleaning markdown.
 */

import { STATE_UPDATE_MARKER } from "./constants";
import { WebsiteState } from "../hooks/use-orchestrator";

/**
 * Artifact marker types that can be detected in streaming content.
 */
export type ArtifactMarker = 
  | { type: "sitemap"; detected: boolean }
  | { type: "prd"; detected: boolean };

/**
 * Cleans markdown text by removing escape sequences and code block markers.
 * 
 * @param text - Raw markdown text to clean
 * @returns Cleaned markdown text
 */
export function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/```markdown/g, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Parses a state update from streaming content.
 * 
 * Looks for the STATE_UPDATE_MARKER in the content and extracts the JSON state object.
 * 
 * @param streamContent - Full streaming content that may contain a state update
 * @returns Parsed WebsiteState if found, null otherwise
 */
export function parseStateUpdate(streamContent: string): WebsiteState | null {
  if (!streamContent.includes(STATE_UPDATE_MARKER)) {
    return null;
  }

  const parts = streamContent.split(STATE_UPDATE_MARKER);
  const jsonString = parts[1]?.trim();

  if (!jsonString) {
    return null;
  }

  try {
    const newState = JSON.parse(jsonString) as WebsiteState;
    return newState;
  } catch (e) {
    // JSON is partial or invalid
    console.log("JSON partial or invalid:", e);
    return null;
  }
}

/**
 * Detects artifact markers in streaming content.
 * 
 * Checks for specific patterns that indicate artifact generation is in progress.
 * 
 * @param streamContent - Full streaming content to check
 * @returns Array of detected artifact markers
 */
export function detectArtifactMarkers(streamContent: string): ArtifactMarker[] {
  const markers: ArtifactMarker[] = [];

  if (streamContent.includes("🏗️ **Building Sitemap")) {
    markers.push({ type: "sitemap", detected: true });
  }

  if (streamContent.includes("📋 **Drafting Technical")) {
    markers.push({ type: "prd", detected: true });
  }

  return markers;
}

/**
 * Generates a clean confirmation message based on the current state.
 * 
 * @param currentStep - Current workflow step
 * @param newState - New state object
 * @param beforeMarker - Content before the state update marker
 * @returns Clean assistant message text
 */
export function generateAssistantMessage(
  currentStep: string,
  newState: WebsiteState,
  beforeMarker: string
): string {
  if (currentStep === "planning" || newState.sitemap?.length > 0) {
    return "Sitemap finalized! Take a look.";
  } else if (currentStep === "prd" || newState.prd_document) {
    return "System specifications are ready for review.";
  } else if (currentStep === "building" || newState.generated_code) {
    return "Building your website now...";
  } else {
    // Extract actual assistant message if present
    const cleanedText = beforeMarker
      .replace(/🏗️ \*\*Building Sitemap\*\*.*$/s, "")
      .replace(/📋 \*\*Drafting Technical.*?\*\*.*$/s, "")
      .replace(/🚀 \*\*Starting Build\*\*.*$/s, "")
      .replace(/🏗️.*Architecting.*$/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
    return cleanedText || "Processing complete!";
  }
}
