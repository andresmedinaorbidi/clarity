"use client";
import React, { useState, useEffect } from "react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";
import { ScreenTab, ArtifactTab, StepName } from "@/lib/constants";
import { getActiveScreen } from "@/lib/screenUtils";
import { useNotificationManager } from "./NotificationManager";
import ArtifactWorkspaceHeader from "./ArtifactWorkspaceHeader";
import ArtifactRenderer from "./ArtifactRenderer";

interface ArtifactWorkspaceProps {
  state: WebsiteState;
  loading: boolean;
  onSend?: (message: string) => void;
}


export default function ArtifactWorkspace({ state, loading, onSend }: ArtifactWorkspaceProps) {
  const { isAdvancedMode } = useAdvancedMode();
  const [activeScreen, setActiveScreen] = useState<ScreenTab>("research");
  const [activeTab, setActiveTab] = useState<ArtifactTab>("brief");
  
  // Use notification manager hook
  const [notifications, clearNotification] = useNotificationManager(state, activeTab);

  // Clear notification when tab is activated
  const handleTabClick = (tab: ArtifactTab) => {
    setActiveTab(tab);
    clearNotification(tab);
  };

  // Auto-switch tabs for Advanced Mode only (screens handle their own progression)
  useEffect(() => {
    if (!isAdvancedMode) return;
    
    // Only auto-switch for advanced mode tabs
    if (
      state.current_step === StepName.SEO ||
      state.current_step === StepName.COPYWRITING ||
      (state.seo_data || state.copywriting)
    ) {
      setActiveTab("marketing");
    } else if (
      state.current_step === StepName.PRD ||
      (state.prd_document && state.prd_document.length > 0)
    ) {
      setActiveTab("prd");
    } else if (
      state.current_step === StepName.BUILDING ||
      (state.generated_code && state.generated_code.length > 0)
    ) {
      setActiveTab("preview");
    } else if (state.project_brief) {
      setActiveTab("brief");
    } else if (state.sitemap && state.sitemap.length > 0) {
      setActiveTab("sitemap");
    }
  }, [state.current_step, state.sitemap, state.seo_data, state.copywriting, state.generated_code, state.project_brief, state.prd_document, isAdvancedMode]);

  // Auto-switch to appropriate screen based on state
  useEffect(() => {
    const active = getActiveScreen(state);
    setActiveScreen(active);
  }, [state.current_step, state.project_brief, state.sitemap, state.generated_code]);

  // If current active tab is advanced-only and Advanced Mode is off, switch to a basic tab
  useEffect(() => {
    if (!isAdvancedMode) {
      const advancedTabs: ArtifactTab[] = ["marketing", "prd"];
      if (advancedTabs.includes(activeTab)) {
        // Switch to first available basic tab
        if (state.project_brief) {
          setActiveTab("brief");
        } else if (state.sitemap && state.sitemap.length > 0) {
          setActiveTab("sitemap");
        } else {
          setActiveTab("brief");
        }
      }
    }
  }, [isAdvancedMode, activeTab, state.project_brief, state.sitemap]);

  const handleResearchApprove = () => {
    if (onSend && !loading) {
      onSend("Proceed");
    }
  };

  const handleBlueprintApprove = () => {
    if (onSend && !loading) {
      onSend("Proceed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark">
      {/* Header with Screen Tabs and Advanced Mode Toggle */}
      <ArtifactWorkspaceHeader
        state={state}
        activeScreen={activeScreen}
        activeTab={activeTab}
        isAdvancedMode={isAdvancedMode}
        notifications={notifications}
        onScreenChange={setActiveScreen}
        onTabChange={handleTabClick}
      />

      {/* Artifact Content Area */}
      <ArtifactRenderer
        state={state}
        activeScreen={activeScreen}
        activeTab={activeTab}
        loading={loading}
        isAdvancedMode={isAdvancedMode}
        onResearchApprove={handleResearchApprove}
        onBlueprintApprove={handleBlueprintApprove}
      />
    </div>
  );
}
