/**
 * ArtifactRenderer Component
 * 
 * Handles rendering of all artifact content (screens and tabs).
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Monitor,
  Sparkles,
  Loader2,
  FileText,
  Map,
  Megaphone,
  Code,
  Search,
} from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { ScreenTab, ArtifactTab } from "@/lib/constants";
import {
  shouldShowResearchScreen,
  shouldShowBlueprintScreen,
  shouldShowPreviewScreen,
  isValidHTML,
} from "@/lib/screenUtils";
import ResearchScreen from "./ResearchScreen";
import BlueprintScreen from "./BlueprintScreen";
import VisualBrief from "./VisualBrief";
import VisualSitemap from "./VisualSitemap";

interface ArtifactRendererProps {
  state: WebsiteState;
  activeScreen: ScreenTab;
  activeTab: ArtifactTab;
  loading: boolean;
  isAdvancedMode: boolean;
  onResearchApprove?: () => void;
  onBlueprintApprove?: () => void;
}

export default function ArtifactRenderer({
  state,
  activeScreen,
  activeTab,
  loading,
  isAdvancedMode,
  onResearchApprove,
  onBlueprintApprove,
}: ArtifactRendererProps) {
  const showResearchScreen = shouldShowResearchScreen(state);
  const showBlueprintScreen = shouldShowBlueprintScreen(state);
  const showPreviewScreen = shouldShowPreviewScreen(state);
  const isGeneratedCodeValid = isValidHTML(state.generated_code);
  const showAdvancedTabs = isAdvancedMode && (state.seo_data || state.copywriting || state.prd_document);

  return (
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
            <ResearchScreen
              state={state}
              onApprove={onResearchApprove || (() => {})}
              loading={loading}
            />
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
            <BlueprintScreen
              state={state}
              onApprove={onBlueprintApprove || (() => {})}
              loading={loading}
            />
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
                  <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                    Build Preview
                  </h2>
                  {loading && state.current_step === "building" && (
                    <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                      <Sparkles size={14} /> Building...
                    </div>
                  )}
                </div>
                <div
                  className="bg-white border-2 border-brand-border rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 10px 30px -5px rgba(190, 255, 80, 0.2)" }}
                >
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
                  <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                    Build Preview
                  </h2>
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
              {/* Brief Tab */}
              {activeTab === "brief" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                      Full Project Brief
                    </h2>
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

              {/* Sitemap Tab */}
              {activeTab === "sitemap" && (
                <div className="max-w-5xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                      Full Sitemap{" "}
                      <span className="text-brand-secondary">
                        ({state.sitemap?.length || 0} {state.sitemap?.length === 1 ? "page" : "pages"})
                      </span>
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
                                      <h4 className="text-sm font-bold text-brand-primary">{pageName}</h4>
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
                                      <h4 className="text-base font-bold text-brand-primary">{pageName}</h4>
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
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                      Technical Specification
                    </h2>
                    {loading && state.current_step === "prd" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> Drafting...
                      </div>
                    )}
                  </div>

                  {state.prd_document ? (
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 prose prose-invert max-w-none">
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
                          Generating Technical Spec...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Tab (Advanced Mode) */}
              {activeTab === "preview" && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-widest text-text-primary">
                      Build Preview
                    </h2>
                    {loading && state.current_step === "building" && (
                      <div className="flex items-center gap-2 text-brand-primary animate-pulse text-xs font-bold">
                        <Sparkles size={14} /> Building...
                      </div>
                    )}
                  </div>

                  {isGeneratedCodeValid ? (
                    <div
                      className="bg-white border-2 border-brand-border rounded-2xl overflow-hidden"
                      style={{ boxShadow: "0 10px 30px -5px rgba(190, 255, 80, 0.2)" }}
                    >
                      <iframe
                        srcDoc={state.generated_code}
                        className="w-full h-[600px] border-0"
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  ) : state.generated_code && state.generated_code.length > 0 ? (
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Monitor className="text-brand-primary" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Code Generation in Progress</h3>
                        <p className="text-sm text-text-secondary">
                          The website code is being generated. Please wait...
                        </p>
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
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
