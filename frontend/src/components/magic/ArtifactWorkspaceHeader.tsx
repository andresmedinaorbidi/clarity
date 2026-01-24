/**
 * ArtifactWorkspaceHeader Component
 * 
 * Handles the header with screen tabs, advanced mode tabs, and controls.
 */

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Map,
  Megaphone,
  Monitor,
  Code,
  Search as SearchIcon,
  Layout,
} from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { ScreenTab, ArtifactTab, StepName } from "@/lib/constants";
import {
  shouldShowResearchScreen,
  shouldShowBlueprintScreen,
  shouldShowPreviewScreen,
} from "@/lib/screenUtils";
import AdvancedModeToggle from "./AdvancedModeToggle";
import SessionSelector from "./SessionSelector";

interface ArtifactWorkspaceHeaderProps {
  state: WebsiteState;
  activeScreen: ScreenTab;
  activeTab: ArtifactTab;
  isAdvancedMode: boolean;
  notifications: Set<ArtifactTab>;
  onScreenChange: (screen: ScreenTab) => void;
  onTabChange: (tab: ArtifactTab) => void;
}

export default function ArtifactWorkspaceHeader({
  state,
  activeScreen,
  activeTab,
  isAdvancedMode,
  notifications,
  onScreenChange,
  onTabChange,
}: ArtifactWorkspaceHeaderProps) {
  const showResearchScreen = shouldShowResearchScreen(state);
  const showBlueprintScreen = shouldShowBlueprintScreen(state);
  const showPreviewScreen = shouldShowPreviewScreen(state);

  // Define screen tabs (always visible)
  const screenTabs: Array<{
    id: ScreenTab;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    available: boolean;
  }> = [
    {
      id: "research",
      icon: SearchIcon,
      label: "Research",
      available: showResearchScreen || !!state.project_name || !!state.industry,
    },
    {
      id: "blueprint",
      icon: Layout,
      label: "Blueprint",
      available: showBlueprintScreen || !!state.project_brief || (state.sitemap && state.sitemap.length > 0),
    },
    {
      id: "preview",
      icon: Monitor,
      label: "Preview",
      available: showPreviewScreen || !!(state.generated_code && state.generated_code.length > 0),
    },
  ];

  // Define artifact tabs with icons and availability
  const allTabs: Array<{
    id: ArtifactTab;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    available: boolean;
    hasUpdates: boolean;
    hasNotification: boolean;
    advancedOnly: boolean;
  }> = [
    {
      id: "brief",
      icon: FileText,
      label: "Brief",
      available: !!state.project_brief,
      hasUpdates: state.current_step === StepName.STRATEGY || state.current_step === StepName.RESEARCH,
      hasNotification: notifications.has("brief"),
      advancedOnly: false,
    },
    {
      id: "sitemap",
      icon: Map,
      label: "Sitemap",
      available: !!(state.sitemap && state.sitemap.length > 0),
      hasUpdates: state.current_step === StepName.PLANNING,
      hasNotification: notifications.has("sitemap"),
      advancedOnly: false,
    },
    {
      id: "marketing",
      icon: Megaphone,
      label: "Marketing",
      available: !!(state.seo_data || state.copywriting),
      hasUpdates: state.current_step === StepName.SEO || state.current_step === StepName.COPYWRITING,
      hasNotification: notifications.has("marketing"),
      advancedOnly: true,
    },
    {
      id: "prd",
      icon: Code,
      label: "Technical Spec",
      available: !!state.prd_document,
      hasUpdates: state.current_step === StepName.PRD,
      hasNotification: notifications.has("prd"),
      advancedOnly: true,
    },
    {
      id: "preview",
      icon: Monitor,
      label: "Preview",
      available: !!(state.generated_code && state.generated_code.length > 0),
      hasUpdates: state.current_step === StepName.BUILDING,
      hasNotification: notifications.has("preview"),
      advancedOnly: false,
    },
  ];

  // Filter tabs based on Advanced Mode
  const tabs = allTabs.filter((tab) => !tab.advancedOnly || isAdvancedMode);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border bg-brand-surface">
      <div className="flex items-center gap-1">
        {/* Screen Navigation Tabs - Always visible */}
        {screenTabs.map((screen) => {
          const Icon = screen.icon;
          const isActive = activeScreen === screen.id;
          const isDisabled = !screen.available;

          return (
            <button
              key={screen.id}
              onClick={() => !isDisabled && onScreenChange(screen.id)}
              disabled={isDisabled}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg transition-all
                ${isActive
                  ? "bg-brand-primary text-text-primary"
                  : isDisabled
                  ? "text-text-muted opacity-40 cursor-not-allowed"
                  : "text-text-primary hover:bg-brand-surface"}
              `}
              title={screen.label}
            >
              <Icon size={18} />
            </button>
          );
        })}

        {/* Advanced Mode Tabs - Only in Advanced Mode */}
        {isAdvancedMode && tabs.length > 0 && (
          <>
            <div className="w-px h-6 bg-brand-border mx-1" />
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = !tab.available && !tab.hasUpdates;
              const showNotification = tab.hasNotification && !isActive;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-lg transition-all
                    ${isActive
                      ? "bg-brand-primary text-text-primary"
                      : isDisabled
                      ? "text-text-muted opacity-40 cursor-not-allowed"
                      : "text-text-primary hover:bg-brand-surface"}
                  `}
                  title={tab.label}
                >
                  <Icon size={18} />
                  {/* Active processing indicator (pulsing dot) */}
                  {tab.hasUpdates && !isActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
                  )}
                  {/* Background update notification (blue dot with pulse animation) */}
                  {showNotification && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"
                    >
                      <motion.span
                        className="absolute inset-0 bg-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.8, 0, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
      {/* Right side controls: Session Selector and Advanced Mode Toggle */}
      <div className="flex items-center gap-2">
        <SessionSelector />
        <AdvancedModeToggle />
      </div>
    </div>
  );
}
