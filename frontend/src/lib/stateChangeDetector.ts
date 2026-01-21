/**
 * State change detection utilities.
 * 
 * Pure functions for detecting changes in WebsiteState and determining
 * which artifacts have been updated.
 */

import { WebsiteState } from "@/hooks/use-orchestrator";
import { ArtifactTab } from "./constants";

/**
 * Detect which artifacts have changed between two states.
 * 
 * @param prev - Previous WebsiteState
 * @param next - Current WebsiteState
 * @returns Set of artifact tabs that have been updated
 */
export function detectArtifactChanges(
  prev: WebsiteState | null,
  next: WebsiteState
): Set<ArtifactTab> {
  const changes = new Set<ArtifactTab>();

  if (!prev) {
    // First state - no changes to detect
    return changes;
  }

  // Check for project_brief changes
  if (next.project_brief !== prev.project_brief && next.project_brief) {
    changes.add("brief");
  }

  // Check for sitemap changes
  if (
    JSON.stringify(next.sitemap) !== JSON.stringify(prev.sitemap) &&
    next.sitemap &&
    next.sitemap.length > 0
  ) {
    changes.add("sitemap");
  }

  // Check for marketing changes (SEO or copywriting)
  if (
    JSON.stringify(next.seo_data) !== JSON.stringify(prev.seo_data) ||
    JSON.stringify(next.copywriting) !== JSON.stringify(prev.copywriting)
  ) {
    if (next.seo_data || next.copywriting) {
      changes.add("marketing");
    }
  }

  // Check for generated code changes
  if (
    next.generated_code !== prev.generated_code &&
    next.generated_code &&
    next.generated_code.length > 0
  ) {
    changes.add("preview");
  }

  // Check for PRD document changes
  if (
    next.prd_document !== prev.prd_document &&
    next.prd_document &&
    next.prd_document.length > 0
  ) {
    changes.add("prd");
  }

  return changes;
}
