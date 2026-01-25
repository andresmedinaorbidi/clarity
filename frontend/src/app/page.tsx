"use client";
import { useOrchestrator } from "@/hooks/use-orchestrator";
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

function HomeContent() {
  const { state, loading, sendMessage } = useOrchestrator();
  const { isAdvancedMode } = useAdvancedMode();

  const fadeProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: "easeInOut" }
  };

  const chatCount = state.chat_history.length;
  const hasStarted = chatCount > 0;

  return (
    <main className="h-screen bg-brand-dark text-text-primary overflow-hidden">
      <AnimatePresence mode="wait">
        {/* HERO SECTION: Initial intake (unchanged) */}
        {!hasStarted && (
          <motion.div key="hero" className="h-full" {...fadeProps}>
            <HeroSection onStart={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* POST-HERO: FlowShell (new) or WorkspaceView (legacy) */}
        {hasStarted && USE_FLOW_SHELL && (
          <motion.div key="flowshell" className="h-full" {...fadeProps}>
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