"use client";
import React, { useState, useEffect, useRef } from "react";
import { FolderOpen, ChevronDown, X } from "lucide-react";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import { motion, AnimatePresence } from "framer-motion";

interface Session {
  session_id: string;
  created_at: string | null;
  updated_at: string | null;
  project_name: string;
  current_step: string;
}

export default function SessionSelector() {
  const { listAllSessions, loadSession, sessionId } = useOrchestrator();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const allSessions = await listAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = async (targetSessionId: string) => {
    if (targetSessionId === sessionId) {
      setIsOpen(false);
      return;
    }
    
    try {
      await loadSession(targetSessionId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const currentSession = sessions.find((s) => s.session_id === sessionId);
  const displayName = currentSession?.project_name || "Current Session";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface hover:bg-brand-dark transition-all"
        title="Load Previous Session"
      >
        <FolderOpen size={14} className="text-text-primary" />
        <span className="text-xs font-medium text-text-primary max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown 
          size={12} 
          className={`text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-brand-surface border border-brand-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col"
          >
            <div className="px-4 py-2 border-b border-brand-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Previous Sessions</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1">
              {loading ? (
                <div className="px-4 py-8 text-center text-text-secondary text-sm">
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-secondary text-sm">
                  No previous sessions found
                </div>
              ) : (
                <div className="py-2">
                  {sessions.map((session) => {
                    const isActive = session.session_id === sessionId;
                    const date = session.updated_at 
                      ? new Date(session.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Unknown";

                    return (
                      <button
                        key={session.session_id}
                        onClick={() => handleSessionSelect(session.session_id)}
                        className={`w-full px-4 py-3 text-left hover:bg-brand-dark transition-colors border-b border-brand-border last:border-b-0 ${
                          isActive ? "bg-brand-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              isActive ? "text-brand-primary" : "text-text-primary"
                            }`}>
                              {session.project_name || "Untitled Project"}
                              {isActive && (
                                <span className="ml-2 text-xs text-brand-primary">(Current)</span>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary mt-1">
                              Step: {session.current_step} • {date}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
