"use client";
import React, { useState } from "react";
import { Layers } from "lucide-react";
import ProgressTimeline from "./ProgressTimeline";
import ProgressIndicator from "./ProgressIndicator";
import ApprovalCard from "./ApprovalCard";
import ChatInterface from "./ChatInterface";
import BuilderSection from "./BuilderSection";
import EngineeringStream from "./EngineeringStream";
import BriefCard from "./BriefCard";
import ArtifactDrawer from "./ArtifactDrawer";
import { WebsiteState } from "@/hooks/use-orchestrator";

interface BuildViewProps {
  state: WebsiteState;
  onSend: (message: string) => void;
  loading: boolean;
}

export default function BuildView({ state, onSend, loading }: BuildViewProps) {
  const [isArtifactDrawerOpen, setIsArtifactDrawerOpen] = useState(false);

  // DEBUG: Log current state
  React.useEffect(() => {
    console.log('[BuildView DEBUG]', {
      current_step: state.current_step,
      direction_snapshot: state.direction_snapshot,
      sitemap_length: state.sitemap?.length,
      progress_events_count: state.progress_events?.length,
    });
  }, [state.current_step, state.direction_snapshot, state.sitemap, state.progress_events]);

  // Determine if we should show "isThinking" animation
  const isThinking = loading && state.chat_history.length > 0 &&
    state.chat_history[state.chat_history.length - 1]?.role === "user";

  // Determine what to show in the main content area
  const renderMainContent = () => {
    const step = state.current_step;

    // GATE A: Direction Lock Approval
    if (step === "direction_lock" && state.direction_snapshot) {
      return (
        <ApprovalCard
          type="direction"
          directionSnapshot={state.direction_snapshot}
          onApprove={() => onSend("looks perfect, let's continue")}
          onEdit={(feedback) => onSend(feedback)}
        />
      );
    }

    // GATE B: Structure Confirm Approval
    if (step === "structure_confirm" && state.sitemap && state.sitemap.length > 0) {
      return (
        <ApprovalCard
          type="structure"
          sitemap={state.sitemap}
          onApprove={() => onSend("structure looks great, proceed")}
          onEdit={(feedback) => onSend(feedback)}
        />
      );
    }

    // Reveal Phase: Show website preview
    if (step === "reveal" && state.generated_code) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <BuilderSection state={state} hideChat={true} />
          </div>
        </div>
      );
    }

    // Engineering phases: Show EngineeringStream for PRD and building
    if (step === "prd" || (step === "building" && !state.generated_code)) {
      return <EngineeringStream state={state} />;
    }

    // Background work phases: Show progress indicator
    const backgroundPhases = ["strategy", "ux", "seo", "copywriting"];
    if (backgroundPhases.includes(step)) {
      return <ProgressIndicator phase={step} events={state.progress_events} />;
    }

    // Intake phase: Show simple welcome state + Brief Card if data exists
    if (step === "intake") {
      const hasProjectData = state.project_name || state.industry || state.brand_colors.length > 0;

      return (
        <div className="flex flex-col items-center justify-center h-full px-8">
          {hasProjectData ? (
            <BriefCard state={state} />
          ) : (
            <div className="text-center">
              <span className="text-8xl mb-8">📋</span>
              <h2 className="text-4xl font-black text-brand-primary mb-4">
                Let's Build Your Website
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl">
                Tell me about your project in the chat, and I'll guide you through creating your perfect website.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <span className="text-6xl mb-6">⚙️</span>
        <h2 className="text-3xl font-black text-brand-primary mb-4">
          Working on Your Website
        </h2>
        <p className="text-lg text-text-secondary max-w-md">
          Progress updates will appear here as we build your site.
        </p>
      </div>
    );
  };

  // Check if artifacts are available
  const hasArtifacts = state.sitemap?.length > 0 || state.seo_data || state.copywriting ||
    state.prd_document || state.generated_code;

  return (
    <>
      <div className="flex h-screen bg-brand-dark overflow-hidden">
        {/* Main Content Area (left) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Progress Timeline (top bar) */}
          <ProgressTimeline events={state.progress_events} currentStep={state.current_step} />

          {/* Dynamic Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-brand-dark">
            {renderMainContent()}
          </div>
        </div>

        {/* Chat Sidebar (right) - fixed width */}
        <div className="w-[450px] flex-shrink-0">
          <ChatInterface
            messages={state.chat_history}
            onSend={onSend}
            loading={loading}
            isThinking={isThinking}
            state={state}
          />
        </div>
      </div>

      {/* Floating Artifact Drawer Button */}
      {hasArtifacts && (
        <button
          onClick={() => setIsArtifactDrawerOpen(true)}
          className="fixed bottom-8 right-[470px] z-40 p-4 bg-brand-primary text-white rounded-full shadow-2xl hover:shadow-brand-primary/50 hover:scale-110 transition-all duration-200"
          title="View Artifacts"
        >
          <Layers size={24} />
        </button>
      )}

      {/* Artifact Drawer */}
      <ArtifactDrawer
        state={state}
        isOpen={isArtifactDrawerOpen}
        onClose={() => setIsArtifactDrawerOpen(false)}
      />
    </>
  );
}
