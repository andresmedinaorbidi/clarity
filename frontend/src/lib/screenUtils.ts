/**
 * Screen navigation utilities.
 * 
 * Pure functions for determining which screen to show based on application state.
 */

import { WebsiteState } from "@/hooks/use-orchestrator";
import { StepName, ScreenTab } from "./constants";

/**
 * Determine which screen should be active based on the current state.
 * 
 * @param state - Current WebsiteState
 * @returns The active screen tab
 */
export function getActiveScreen(state: WebsiteState): ScreenTab {
  if (shouldShowResearchScreen(state)) {
    return "research";
  } else if (shouldShowBlueprintScreen(state)) {
    return "blueprint";
  } else if (shouldShowPreviewScreen(state)) {
    return "preview";
  }
  // Default to research if nothing matches
  return "research";
}

/**
 * Check if the Research screen should be shown.
 * 
 * Screen 1 (Research): intake, research steps
 * 
 * @param state - Current WebsiteState
 * @returns True if research screen should be shown
 */
export function shouldShowResearchScreen(state: WebsiteState): boolean {
  return (
    state.current_step === StepName.INTAKE ||
    state.current_step === StepName.RESEARCH ||
    !!state.project_name ||
    !!state.industry
  );
}

/**
 * Check if the Blueprint screen should be shown.
 * 
 * Screen 2 (Blueprint): strategy, ux, planning steps
 * Also shown if project_brief or sitemap exists.
 * 
 * @param state - Current WebsiteState
 * @returns True if blueprint screen should be shown
 */
export function shouldShowBlueprintScreen(state: WebsiteState): boolean {
  return (
    state.current_step === StepName.STRATEGY ||
    state.current_step === StepName.UX ||
    state.current_step === StepName.PLANNING ||
    !!state.project_brief ||
    (state.sitemap && state.sitemap.length > 0)
  );
}

/**
 * Check if the Preview screen should be shown.
 * 
 * Screen 3 (Preview): seo, copywriting, prd, building steps
 * Also shown if generated_code exists.
 * 
 * @param state - Current WebsiteState
 * @returns True if preview screen should be shown
 */
export function shouldShowPreviewScreen(state: WebsiteState): boolean {
  return (
    state.current_step === StepName.SEO ||
    state.current_step === StepName.COPYWRITING ||
    state.current_step === StepName.PRD ||
    state.current_step === StepName.BUILDING ||
    !!(state.generated_code && state.generated_code.length > 0)
  );
}

/**
 * Check if generated code is valid HTML (not Python code or error).
 * 
 * @param generatedCode - The generated code string
 * @returns True if the code looks like valid HTML
 */
export function isValidHTML(generatedCode: string | undefined): boolean {
  if (!generatedCode || generatedCode.length === 0) {
    return false;
  }
  
  // Check for Python code indicators
  if (
    generatedCode.includes("python") ||
    generatedCode.includes("path =") ||
    generatedCode.includes(".txt")
  ) {
    return false;
  }
  
  // Check for HTML indicators
  const trimmed = generatedCode.trim();
  return (
    trimmed.startsWith("<!") ||
    trimmed.startsWith("<html") ||
    generatedCode.includes("<div") ||
    generatedCode.includes("<body")
  );
}
