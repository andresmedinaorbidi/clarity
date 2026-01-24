/**
 * NotificationManager Component
 * 
 * Handles state change tracking and notification management.
 */

import { useEffect, useRef, useState } from "react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { ArtifactTab } from "@/lib/constants";
import { detectArtifactChanges } from "@/lib/stateChangeDetector";

interface NotificationManagerProps {
  state: WebsiteState;
  activeTab: ArtifactTab;
  onNotificationsChange: (notifications: Set<ArtifactTab>) => void;
}

/**
 * Hook to manage artifact change notifications.
 * 
 * @param state - Current WebsiteState
 * @param activeTab - Currently active artifact tab
 * @returns Tuple of [notifications, clearNotification function]
 */
export function useNotificationManager(
  state: WebsiteState,
  activeTab: ArtifactTab
): [Set<ArtifactTab>, (tab: ArtifactTab) => void] {
  const [notifications, setNotifications] = useState<Set<ArtifactTab>>(new Set());
  const prevStateRef = useRef<WebsiteState | null>(null);

  // Track state changes and set notifications
  useEffect(() => {
    const changes = detectArtifactChanges(prevStateRef.current, state);
    
    if (changes.size > 0) {
      setNotifications((prev) => new Set([...prev, ...changes]));
    }

    prevStateRef.current = state;
  }, [state.project_brief, state.sitemap, state.seo_data, state.copywriting, state.generated_code, state.prd_document]);

  // Clear notification when tab is activated
  const clearNotification = (tab: ArtifactTab) => {
    setNotifications((prev) => {
      const next = new Set(prev);
      next.delete(tab);
      return next;
    });
  };

  // Clear notification when active tab changes
  useEffect(() => {
    setNotifications((prev) => {
      const next = new Set(prev);
      next.delete(activeTab);
      return next;
    });
  }, [activeTab]);

  return [notifications, clearNotification];
}
