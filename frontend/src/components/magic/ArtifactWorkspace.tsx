"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Map,
  Megaphone,
  Monitor,
  Sparkles,
  Loader2,
  Lightbulb,
  Target,
  Users,
  Search,
  Check,
  Code,
  Search as SearchIcon,
  Layout,
} from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";
import AdvancedModeToggle from "./AdvancedModeToggle";
import IntakeCard from "./IntakeCard";
import VisualBrief from "./VisualBrief";
import VisualSitemap from "./VisualSitemap";
import ResearchScreen from "./ResearchScreen";
import BlueprintScreen from "./BlueprintScreen";
import {
  getActiveScreen,
  shouldShowResearchScreen,
  shouldShowBlueprintScreen,
  shouldShowPreviewScreen,
  isValidHTML,
} from "@/lib/screenUtils";
import { detectArtifactChanges } from "@/lib/stateChangeDetector";
import { ScreenTab, ArtifactTab } from "@/lib/constants";

interface ArtifactWorkspaceProps {
  state: WebsiteState;
  loading: boolean;
  onSend?: (message: string) => void;
}


export default function ArtifactWorkspace({ state, loading, onSend }: ArtifactWorkspaceProps) {
  const { isAdvancedMode } = useAdvancedMode();
  const [activeScreen, setActiveScreen] = useState<ScreenTab>("research");
  const [activeTab, setActiveTab] = useState<ArtifactTab>("brief");
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
  const handleTabClick = (tab: ArtifactTab) => {
    setActiveTab(tab);
    setNotifications((prev) => {
      const next = new Set(prev);
      next.delete(tab);
      return next;
    });
  };

  // Auto-switch tabs for Advanced Mode only (screens handle their own progression)
  useEffect(() => {
    if (!isAdvancedMode) return;
    
    // Only auto-switch for advanced mode tabs
    if (
      state.current_step === "seo" ||
      state.current_step === "copywriting" ||
      (state.seo_data || state.copywriting)
    ) {
      setActiveTab("marketing");
    } else if (
      state.current_step === "prd" ||
      (state.prd_document && state.prd_document.length > 0)
    ) {
      setActiveTab("prd");
    } else if (
      state.current_step === "building" ||
      (state.generated_code && state.generated_code.length > 0)
    ) {
      setActiveTab("preview");
    } else if (state.project_brief) {
      setActiveTab("brief");
    } else if (state.sitemap && state.sitemap.length > 0) {
      setActiveTab("sitemap");
    }
  }, [state.current_step, state.sitemap, state.seo_data, state.copywriting, state.generated_code, state.project_brief, state.prd_document, isAdvancedMode]);

  // Clear notification when auto-switching to a tab
  useEffect(() => {
    setNotifications((prev) => {
      const next = new Set(prev);
      next.delete(activeTab);
      return next;
    });
  }, [activeTab]);

  // Define tabs with icons and availability
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
      hasUpdates: state.current_step === "strategy" || state.current_step === "research",
      hasNotification: notifications.has("brief"),
      advancedOnly: false,
    },
    {
      id: "sitemap",
      icon: Map,
      label: "Sitemap",
      available: state.sitemap && state.sitemap.length > 0,
      hasUpdates: state.current_step === "planning",
      hasNotification: notifications.has("sitemap"),
      advancedOnly: false,
    },
    {
      id: "marketing",
      icon: Megaphone,
      label: "Marketing",
      available: !!(state.seo_data || state.copywriting),
      hasUpdates: state.current_step === "seo" || state.current_step === "copywriting",
      hasNotification: notifications.has("marketing"),
      advancedOnly: true,
    },
    {
      id: "prd",
      icon: Code,
      label: "Technical Spec",
      available: !!state.prd_document,
      hasUpdates: state.current_step === "prd",
      hasNotification: notifications.has("prd"),
      advancedOnly: true,
    },
    {
      id: "preview",
      icon: Monitor,
      label: "Preview",
      available: !!(state.generated_code && state.generated_code.length > 0),
      hasUpdates: state.current_step === "building",
      hasNotification: notifications.has("preview"),
      advancedOnly: false,
    },
  ];

  // Filter tabs based on Advanced Mode
  const tabs = allTabs.filter((tab) => !tab.advancedOnly || isAdvancedMode);

  // If current active tab is advanced-only and Advanced Mode is off, switch to a basic tab
  useEffect(() => {
    if (!isAdvancedMode) {
      const currentTab = allTabs.find((t) => t.id === activeTab);
      if (currentTab?.advancedOnly) {
        // Switch to first available basic tab
        const basicTab = allTabs.find((t) => !t.advancedOnly && (t.available || t.hasUpdates));
        if (basicTab) {
          setActiveTab(basicTab.id);
        } else {
          // Fallback to brief
          setActiveTab("brief");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdvancedMode]);

  // Determine which screen to show based on current_step (mapped to 3-screen UI)
  const showResearchScreen = shouldShowResearchScreen(state);
  const showBlueprintScreen = shouldShowBlueprintScreen(state);
  const showPreviewScreen = shouldShowPreviewScreen(state);
  const isGeneratedCodeValid = isValidHTML(state.generated_code);
  
  // Auto-switch to appropriate screen based on state
  useEffect(() => {
    const active = getActiveScreen(state);
    setActiveScreen(active);
  }, [state.current_step, state.project_brief, state.sitemap, state.generated_code]);
  
  // For Advanced Mode, still show tabs for technical details
  const showAdvancedTabs = isAdvancedMode && (state.seo_data || state.copywriting || state.prd_document);
  
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
      available: showResearchScreen || state.project_name || state.industry,
    },
    {
      id: "blueprint",
      icon: Layout,
      label: "Blueprint",
      available: showBlueprintScreen || state.project_brief || state.sitemap?.length > 0,
    },
    {
      id: "preview",
      icon: Monitor,
      label: "Preview",
      available: showPreviewScreen || (state.generated_code && state.generated_code.length > 0),
    },
  ];
  
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
      {/* Header with Screen Tabs and Advanced Mode Toggle - Always visible */}
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
                onClick={() => !isDisabled && setActiveScreen(screen.id)}
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
                    onClick={() => !isDisabled && handleTabClick(tab.id)}
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
        {/* Advanced Mode Toggle - Always visible */}
        <AdvancedModeToggle />
      </div>

      {/* Artifact Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* Screen 1: Research & Understanding */}
          {activeScreen === "research" && (showResearchScreen || state.project_name || state.industry) ? (
            <motion.div
              key="research"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <ResearchScreen state={state} onApprove={handleResearchApprove} loading={loading} />
            </motion.div>
          ) : activeScreen === "blueprint" && (showBlueprintScreen || state.project_brief || state.sitemap?.length > 0) ? (
            /* Screen 2: Website Blueprint */
            <motion.div
              key="blueprint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full p-8"
            >
              <BlueprintScreen state={state} onApprove={handleBlueprintApprove} loading={loading} />
            </motion.div>
          ) : activeScreen === "preview" && (showPreviewScreen || state.generated_code) ? (
            /* Screen 3: Build Preview */
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full p-8"
            >
              {isGeneratedCodeValid ? (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">Build Preview</h2>
                    {loading && state.current_step === "building" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> Building...
                      </div>
                    )}
                  </div>
                  <div className="bg-white border-2 border-brand-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 10px 30px -5px rgba(190, 255, 80, 0.2)" }}>
                    <iframe
                      srcDoc={state.generated_code}
                      className="w-full h-[600px] border-0"
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : state.generated_code && state.generated_code.length > 0 ? (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">Build Preview</h2>
                  </div>
                  <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Monitor className="text-brand-primary" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">Code Generation in Progress</h3>
                      <p className="text-sm text-text-secondary">
                        The website code is being generated. Please wait...
                      </p>
                      {loading && (
                        <div className="flex items-center justify-center gap-2 text-brand-primary text-xs font-bold mt-4">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Building...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-2xl p-10 overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                      <Monitor className="text-brand-primary animate-pulse" size={24} />
                    </div>
                    <p className="text-sm font-bold text-brand-primary animate-pulse">
                      Building Preview...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Fallback: Show placeholder or Advanced Mode tabs */
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center p-12"
            >
              {showAdvancedTabs ? (
                /* Advanced Mode: Show tab content */
                <div className="h-full p-8 w-full">
                  {/* Advanced Mode tab content will be rendered below */}
                </div>
              ) : (
                /* Placeholder */
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="text-brand-primary animate-pulse" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">Waiting for Research...</h3>
                  <p className="text-sm text-text-secondary">
                    The AI agents are analyzing your project and gathering insights. This workspace will populate as artifacts are generated.
                  </p>
                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-brand-primary text-xs font-bold mt-4">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Mode Tab Content (only when tabs are visible) */}
        {showAdvancedTabs && (
          <div className="h-full p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full"
              >
                {/* Advanced Mode tabs content */}
                {activeTab === "brief" && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">Full Project Brief</h2>
                      {loading && (state.current_step === "strategy" || state.current_step === "research") && (
                        <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                          <Sparkles size={14} /> Generating...
                        </div>
                      )}
                    </div>

                    {state.project_brief ? (
                      <VisualBrief state={state} />
                    ) : (
                      <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-2xl p-10 overflow-hidden">
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                          <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                            <FileText className="text-brand-primary animate-pulse" size={24} />
                          </div>
                          <p className="text-sm font-bold text-brand-primary animate-pulse">
                            Generating Project Brief...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sitemap" && (
                  <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                        Full Sitemap <span className="text-brand-secondary">({state.sitemap?.length || 0} {state.sitemap?.length === 1 ? "page" : "pages"})</span>
                      </h2>
                      {loading && state.current_step === "planning" && (
                        <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                          <Sparkles size={14} /> Architecting...
                        </div>
                      )}
                    </div>

                    {state.sitemap && state.sitemap.length > 0 ? (
                      <VisualSitemap state={state} />
                    ) : (
                      <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-2xl p-10 overflow-hidden">
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                          <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                            <Map className="text-brand-primary animate-pulse" size={24} />
                          </div>
                          <p className="text-sm font-bold text-brand-primary animate-pulse">
                            Generating Sitemap...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Marketing Tab */}
                {activeTab === "marketing" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-text-primary">Marketing Strategy</h2>
                    {loading &&
                      (state.current_step === "seo" || state.current_step === "copywriting") && (
                        <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                          <Sparkles size={14} /> Drafting Content...
                        </div>
                      )}
                  </div>

                  {!state.seo_data && !state.copywriting && loading ? (
                    <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-2xl p-10 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                          <Megaphone className="text-brand-primary animate-pulse" size={24} />
                        </div>
                        <p className="text-sm font-bold text-brand-primary animate-pulse">
                          Crafting Marketing Strategy...
                        </p>
                        <div className="w-full px-20 space-y-3">
                          <div className="h-3 bg-brand-border rounded-full w-3/4 animate-pulse" />
                          <div className="h-3 bg-brand-border rounded-full w-full animate-pulse [animation-delay:0.2s]" />
                          <div className="h-3 bg-brand-border rounded-full w-1/2 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* SEO Section */}
                      {state.seo_data && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                              <Search className="text-brand-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black text-text-primary">SEO</h3>
                          </div>

                          {state.seo_data.primary_keywords &&
                            Array.isArray(state.seo_data.primary_keywords) &&
                            state.seo_data.primary_keywords.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-3">
                                  Primary Keywords
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {state.seo_data.primary_keywords.map((keyword: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1.5 bg-brand-primary text-text-primary text-xs font-semibold rounded-full"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {state.seo_data.page_seo &&
                            Object.keys(state.seo_data.page_seo).length > 0 && (
                              <div className="pt-4 border-t border-brand-border space-y-4">
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-3">
                                  Page Optimization
                                </p>
                                {Object.entries(state.seo_data.page_seo).map(
                                  ([pageName, seoData]: [string, any]) => (
                                    <div
                                      key={pageName}
                                      className="p-4 bg-brand-dark border border-brand-primary/20 rounded-lg space-y-2"
                                    >
                                      <h4 className="text-sm font-bold text-brand-primary">
                                        {pageName}
                                      </h4>
                                      {seoData.meta_title && (
                                        <p className="text-xs text-text-secondary">
                                          <span className="font-bold">Title:</span> {seoData.meta_title}
                                        </p>
                                      )}
                                      {seoData.meta_description && (
                                        <p className="text-xs text-text-secondary">
                                          <span className="font-bold">Description:</span>{" "}
                                          {seoData.meta_description}
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )}

                      {/* Copywriting Section */}
                      {state.copywriting && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                              <Megaphone className="text-brand-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black text-text-primary">Copywriting</h3>
                          </div>

                          {state.copywriting.page_copy &&
                            Object.keys(state.copywriting.page_copy).length > 0 && (
                              <div className="space-y-6">
                                {Object.entries(state.copywriting.page_copy).map(
                                  ([pageName, copyData]: [string, any]) => (
                                    <div
                                      key={pageName}
                                      className="p-6 bg-brand-dark border border-brand-primary/20 rounded-lg space-y-4"
                                    >
                                      <h4 className="text-base font-bold text-brand-primary">
                                        {pageName}
                                      </h4>
                                      {copyData.headline && (
                                        <div>
                                          <p className="text-[9px] uppercase font-bold text-text-muted mb-2">
                                            Headline
                                          </p>
                                          <p className="text-lg font-black text-text-primary leading-tight">
                                            {copyData.headline}
                                          </p>
                                        </div>
                                      )}
                                      {copyData.subheadline && (
                                        <div>
                                          <p className="text-[9px] uppercase font-bold text-text-muted mb-2">
                                            Subheadline
                                          </p>
                                          <p className="text-sm text-text-secondary leading-relaxed">
                                            {copyData.subheadline}
                                          </p>
                                        </div>
                                      )}
                                      {copyData.cta_primary && (
                                        <div>
                                          <p className="text-[9px] uppercase font-bold text-text-muted mb-2">
                                            CTA
                                          </p>
                                          <div className="px-4 py-2.5 bg-brand-primary text-text-primary text-sm font-bold rounded-lg inline-block">
                                            {copyData.cta_primary}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PRD Tab (Technical Spec) - Advanced Mode Only */}
              {activeTab === "prd" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-text-primary">Technical Specifications</h2>
                    {loading && state.current_step === "prd" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> Generating...
                      </div>
                    )}
                  </div>

                  {state.prd_document ? (
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-10 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {state.prd_document}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="relative min-h-[400px] bg-brand-surface border border-brand-border rounded-2xl p-10 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                          <Code className="text-brand-primary animate-pulse" size={24} />
                        </div>
                        <p className="text-sm font-bold text-brand-primary animate-pulse">
                          Generating Technical Specifications...
                        </p>
                        <div className="w-full px-20 space-y-3">
                          <div className="h-3 bg-brand-border rounded-full w-3/4 animate-pulse" />
                          <div className="h-3 bg-brand-border rounded-full w-full animate-pulse [animation-delay:0.2s]" />
                          <div className="h-3 bg-brand-border rounded-full w-1/2 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === "preview" && (
                <div className="h-full flex flex-col bg-brand-dark">
                  {isGeneratedCodeValid ? (
                    <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-2xl border border-brand-border m-4">
                      <iframe
                        srcDoc={state.generated_code}
                        className="w-full h-full border-none"
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  ) : state.generated_code ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4 max-w-md">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Monitor className="text-brand-primary animate-pulse" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Code Generation in Progress</h3>
                        <p className="text-sm text-text-secondary">
                          The website code is being generated. Please wait...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Monitor className="text-brand-primary animate-pulse" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">Building Preview...</h3>
                        <p className="text-sm text-text-secondary">
                          Generating your website code. This may take a moment.
                        </p>
                        {loading && (
                          <div className="flex items-center justify-center gap-2 text-brand-primary text-xs font-bold mt-4">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Compiling...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
