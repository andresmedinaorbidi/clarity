"use client";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import HeroSection from "@/components/magic/HeroSection";
import WorkspaceView from "@/components/magic/WorkspaceView";
import AgentTrace from "@/components/magic/AgentTrace";
import { AdvancedModeProvider, useAdvancedMode } from "@/contexts/AdvancedModeContext";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <main className="h-screen bg-brand-dark text-text-primary overflow-hidden">
      <AnimatePresence mode="wait">
        {/* HERO SECTION: Initial intake (unchanged) */}
        {chatCount === 0 && (
          <motion.div key="hero" className="h-full" {...fadeProps}>
            <HeroSection onStart={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* WORKSPACE: Split-view layout after first message */}
        {chatCount > 0 && (
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