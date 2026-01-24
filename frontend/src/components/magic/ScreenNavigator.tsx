/**
 * ScreenNavigator Component
 * 
 * Handles screen routing logic and auto-switching based on application state.
 */

import { useEffect } from "react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { ScreenTab } from "@/lib/constants";
import { getActiveScreen } from "@/lib/screenUtils";

interface ScreenNavigatorProps {
  state: WebsiteState;
  activeScreen: ScreenTab;
  onScreenChange: (screen: ScreenTab) => void;
}

export function useScreenNavigator(
  state: WebsiteState,
  initialScreen: ScreenTab
): ScreenTab {
  // Auto-switch to appropriate screen based on state
  useEffect(() => {
    const active = getActiveScreen(state);
    // Note: This effect will be used by parent component to update activeScreen
    // The actual state update happens in the parent
  }, [state.current_step, state.project_brief, state.sitemap, state.generated_code]);

  return getActiveScreen(state);
}

/**
 * Hook to determine which screen should be active.
 * Returns the active screen based on current state.
 */
export function useActiveScreen(state: WebsiteState): ScreenTab {
  return getActiveScreen(state);
}
