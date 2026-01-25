"use client";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import HeroSection from "@/components/magic/HeroSection";
import FlowShell from "@/components/magic/FlowShell";
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

        {/* FLOW SHELL: Main workspace after first interaction */}
        {chatCount > 0 && (
          <motion.div key="flow-shell" className="h-full" {...fadeProps}>
            <FlowShell state={state} onSend={sendMessage} loading={loading} />
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