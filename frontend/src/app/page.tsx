"use client";
import { useState, useEffect } from "react";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import { enrichProject } from "@/lib/api";
import HeroSection from "@/components/magic/HeroSection";
import WorkspaceView from "@/components/magic/WorkspaceView";
import FlowShell from "@/components/magic/FlowShell";
import AgentTrace from "@/components/magic/AgentTrace";
import { AdvancedModeProvider, useAdvancedMode } from "@/contexts/AdvancedModeContext";
import { AnimatePresence, motion } from "framer-motion";

/**
 * PR-06: Feature flag to switch between FlowShell (new linear UX) and WorkspaceView (legacy split-view).
 * Set to true to use the new FlowShell UI.
 * Set to false to fall back to WorkspaceView for debugging or comparison.
 */
const USE_FLOW_SHELL = true;

/**
 * PR-07.1: Bootstrapping loading screen shown between Hero and FlowShell
 */
function BootstrappingScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-brand-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-brand-border"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-accent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-brand-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-medium text-text-primary mb-2">
          Setting things up…
        </h2>
        <p className="text-text-secondary text-sm">
          Pulling recommendations for your project
        </p>
      </motion.div>
    </div>
  );
}

function HomeContent() {
  const { state, loading, sendMessage, initializing, refreshState } = useOrchestrator();
  const { isAdvancedMode } = useAdvancedMode();

  // PR-07.1: Track bootstrapping phase after hero submission
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const fadeProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: "easeInOut" as const }
  };

  const chatCount = state.chat_history.length;
  const hasStarted = chatCount > 0;

  // PR-07.1b: Check if inferred object has actual data (not just empty {})
  const hasInferredData = Boolean(
    state.project_meta?.inferred &&
    Object.keys(state.project_meta.inferred).length > 0
  );

  // PR-07.1b: Check if additional_context has actual data (not just empty {})
  const hasAdditionalContext = Boolean(
    state.additional_context &&
    Object.keys(state.additional_context).length > 0
  );

  // PR-07.1b: Check if state is ready (has some meaningful data loaded)
  const isStateReady = Boolean(
    state.project_name ||
    state.industry ||
    hasInferredData ||
    hasAdditionalContext
  );

  // PR-07.1b: End bootstrapping when state becomes ready (has actual inferred data)
  useEffect(() => {
    if (isBootstrapping && isStateReady && !loading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsBootstrapping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isBootstrapping, isStateReady, loading]);

  // PR-07.1b: Extract URL from hero input if present
  const extractUrl = (text: string): string | undefined => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    return urlMatch?.[0];
  };

  // PR-07.1b: Custom sendMessage wrapper that runs enrichment first
  const handleHeroStart = async (input: string) => {
    setIsBootstrapping(true);
    const websiteUrl = extractUrl(input);

    try {
      // Run enrichment first to populate inferred values
      await enrichProject(input, websiteUrl);
      // Refresh state to get the enriched data into React state
      await refreshState();
    } catch (err) {
      console.error("[Enrichment] Error:", err);
      // Continue even if enrichment fails
    }

    // Then send chat message
    await sendMessage(input);
  };

  return (
    <main className="h-screen bg-brand-dark text-text-primary overflow-hidden">
      <AnimatePresence mode="wait">
        {/* HERO SECTION: Initial intake (unchanged) */}
        {!hasStarted && !isBootstrapping && (
          <motion.div key="hero" className="h-full" {...fadeProps}>
            <HeroSection onStart={handleHeroStart} loading={loading} />
          </motion.div>
        )}

        {/* PR-07.1: BOOTSTRAPPING SCREEN: Show while loading initial state */}
        {(isBootstrapping || (hasStarted && !isStateReady && loading)) && USE_FLOW_SHELL && (
          <motion.div key="bootstrapping" className="h-full" {...fadeProps}>
            <BootstrappingScreen />
          </motion.div>
        )}

        {/* POST-HERO: FlowShell (new) or WorkspaceView (legacy) */}
        {hasStarted && !isBootstrapping && isStateReady && USE_FLOW_SHELL && (
          <motion.div key="flowshell" className="h-full" {...fadeProps}>
            <FlowShell state={state} sendMessage={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* Show FlowShell even if not fully ready, as long as not bootstrapping and chat started */}
        {hasStarted && !isBootstrapping && !isStateReady && !loading && USE_FLOW_SHELL && (
          <motion.div key="flowshell-fallback" className="h-full" {...fadeProps}>
            <FlowShell state={state} sendMessage={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* LEGACY WORKSPACE: Split-view layout (only if USE_FLOW_SHELL is false) */}
        {hasStarted && !USE_FLOW_SHELL && (
          <motion.div key="workspace" className="h-full" {...fadeProps}>
            <WorkspaceView state={state} onSend={sendMessage} loading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
      {isAdvancedMode && <AgentTrace state={state} />}
    </main>
  );
}

export default function Home() {
  return (
    <AdvancedModeProvider>
      <HomeContent />
    </AdvancedModeProvider>
  );
}