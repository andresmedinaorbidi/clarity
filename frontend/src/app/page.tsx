"use client";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import HeroSection from "@/components/magic/HeroSection";
import ProcessingSection from "@/components/magic/ProcessingSection";
import RefinementSection from "@/components/magic/RefinementSection";
import BuilderSection from "@/components/magic/BuilderSection";
import AgentTrace from "@/components/magic/AgentTrace";
import EngineeringStream from "@/components/magic/EngineeringStream";
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

  // Engineering Stream: Show during PRD and building phases until code is complete
  const showEngineeringStream = (state.current_step === "prd" || state.current_step === "building") &&
                                 (!state.generated_code || state.generated_code.length === 0);

  // Final Builder View: Show once code generation is complete
  const showFinalBuilder = state.current_step === "building" &&
                          state.generated_code &&
                          state.generated_code.length > 0 &&
                          !loading;

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
        {chatCount === 2 && !isAiSpeaking && !isBuilderStep && !showEngineeringStream && (
          <motion.div key="processing" className="h-full" {...fadeProps}>
            <ProcessingSection state={state} />
          </motion.div>
        )}

        {/* SCREEN 3: REFINEMENT (The Loop for Brief, Sitemap, and PRD) */}
        {chatCount > 0 && (isAiSpeaking || chatCount > 2) && !isBuilderStep && !showEngineeringStream && (
          <motion.div key="refinement" className="h-full" {...fadeProps}>
            <RefinementSection state={state} onSend={sendMessage} loading={loading} />
          </motion.div>
        )}

        {/* SCREEN 4: ENGINEERING STREAM (Matrix-style build phase) */}
        {showEngineeringStream && (
          <EngineeringStream key="engineering-stream" state={state} />
        )}

        {/* SCREEN 5: FINAL BUILDER (Website Preview) */}
        {showFinalBuilder && (
          <motion.div
            key="final-builder"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full"
          >
            <BuilderSection state={state} onSend={sendMessage} loading={loading} />
          </motion.div>
        )}

      </AnimatePresence>
      <AgentTrace state={state} />
    </main>
  );
}