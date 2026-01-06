"use client";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import HeroSection from "@/components/magic/HeroSection";
import ProcessingSection from "@/components/magic/ProcessingSection";
import RefinementSection from "@/components/magic/RefinementSection";
import BuilderSection from "@/components/magic/BuilderSection";
import AgentTrace from "@/components/magic/AgentTrace";
import ConstructionOverlay from "@/components/magic/ConstructionOverlay";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { state, loading, sendMessage } = useOrchestrator();

  const fadeProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: "easeInOut" }
  };

  const chatCount = state.chat_history.length;
  const lastMessage = state.chat_history[chatCount - 1];
  
  // AI is "speaking" if there's a response in progress or finished
  const isAiSpeaking = chatCount > 0 && 
                       lastMessage?.role === "assistant" && 
                       lastMessage?.content?.trim().length > 0;

  // STEP DETERMINATION
  const isBuilderStep = state.current_step === "building" || state.current_step === "completed" || state.current_step === "builder";

  return (
    <main className="h-screen bg-brand-dark text-text-primary overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* SCREEN 1: HERO (No messages yet) */}
        {chatCount === 0 && (
          <motion.div key="hero" className="h-full" {...fadeProps}>
            <HeroSection onStart={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* SCREEN 2: PROCESSING (First prompt, AI hasn't spoken yet) */}
        {chatCount === 2 && !isAiSpeaking && !isBuilderStep && (
          <motion.div key="processing" className="h-full" {...fadeProps}>
            <ProcessingSection state={state} />
          </motion.div>
        )}

        {/* SCREEN 3: REFINEMENT (The Loop for Brief, Sitemap, and PRD) */}
        {/* We stay here if we have messages and we are NOT in the builder phase yet */}
        {chatCount > 0 && (isAiSpeaking || chatCount > 2) && !isBuilderStep && (
          <motion.div key="refinement" className="h-full" {...fadeProps}>
            <RefinementSection state={state} onSend={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* SHOW CONSTRUCTION OVERLAY: If we are in building step but have no code yet */}
        {state.current_step === "building" && !state.generated_code && (
          <ConstructionOverlay key="construction" />
        )}

        {/* BUILDER SCREEN: Only shows when we have code */}
        {state.current_step === "building" && state.generated_code && (
          <motion.div key="builder" className="h-full" {...fadeProps}>
            <BuilderSection state={state} onSend={sendMessage} loading={loading} />
          </motion.div>
        )}

      </AnimatePresence>
      <AgentTrace state={state} />
    </main>
  );
}