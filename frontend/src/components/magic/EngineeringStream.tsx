"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Code, Zap } from "lucide-react";

export default function EngineeringStream({ state }: any) {
  const [prdScroll, setPrdScroll] = useState(0);
  const [codeScroll, setCodeScroll] = useState(0);
  const [displayedPrd, setDisplayedPrd] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const prdRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  // Streaming effect for PRD - gradually reveal content
  useEffect(() => {
    if (state.prd_document && displayedPrd.length < state.prd_document.length) {
      const timer = setTimeout(() => {
        setDisplayedPrd(state.prd_document.slice(0, displayedPrd.length + 50));
      }, 20);
      return () => clearTimeout(timer);
    } else if (state.prd_document) {
      setDisplayedPrd(state.prd_document);
    }
  }, [state.prd_document, displayedPrd]);

  // Streaming effect for code - gradually reveal content
  useEffect(() => {
    if (state.generated_code && displayedCode.length < state.generated_code.length) {
      const timer = setTimeout(() => {
        setDisplayedCode(state.generated_code.slice(0, displayedCode.length + 100));
      }, 10);
      return () => clearTimeout(timer);
    } else if (state.generated_code) {
      setDisplayedCode(state.generated_code);
    }
  }, [state.generated_code, displayedCode]);

  // Auto-scroll PRD panel
  useEffect(() => {
    if (prdRef.current && displayedPrd) {
      const maxScroll = prdRef.current.scrollHeight - prdRef.current.clientHeight;
      setPrdScroll(maxScroll > 0 ? maxScroll : 0);
    }
  }, [displayedPrd]);

  // Auto-scroll code panel
  useEffect(() => {
    if (codeRef.current && displayedCode) {
      const maxScroll = codeRef.current.scrollHeight - codeRef.current.clientHeight;
      setCodeScroll(maxScroll > 0 ? maxScroll : 0);
    }
  }, [displayedCode]);

  // Apply scroll positions
  useEffect(() => {
    if (prdRef.current) {
      prdRef.current.scrollTop = prdScroll;
    }
  }, [prdScroll]);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeScroll;
    }
  }, [codeScroll]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full bg-brand-dark text-text-primary overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent" />
      </div>

      {/* Main Split Layout */}
      <div className="relative h-full flex">
        {/* LEFT PANEL: The Blueprint (PRD) */}
        <div className="w-1/2 border-r border-brand-border flex flex-col">
          {/* Terminal Header */}
          <div className="bg-brand-surface border-b border-brand-border px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-brand-primary" size={18} />
              <span className="text-brand-primary text-sm font-bold">
                Technical Specifications
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-text-muted text-xs">PROCESSING</span>
            </div>
          </div>

          {/* PRD Content */}
          <div
            ref={prdRef}
            className="flex-1 overflow-auto p-6 space-y-2 custom-scrollbar bg-white/40"
            style={{ scrollBehavior: "auto" }}
          >
            {displayedPrd ? (
              displayedPrd.split('\n').map((line: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm leading-relaxed"
                >
                  {line.startsWith('#') ? (
                    <span className="text-brand-primary font-bold">{line}</span>
                  ) : line.startsWith('-') || line.startsWith('*') ? (
                    <span className="text-text-primary">{line}</span>
                  ) : (
                    <span className="text-text-secondary">{line}</span>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Zap className="text-brand-primary animate-pulse" size={32} />
                <p className="text-text-muted text-sm">Awaiting technical specifications...</p>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="bg-brand-surface border-t border-brand-border px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="animate-pulse">▸</span>
              <span>
                Lines: {displayedPrd ? displayedPrd.split('\n').length : 0} |
                Status: {displayedPrd.length < (state.prd_document?.length || 0) ? "STREAMING" : "COMPLETE"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Construction (Generated Code) */}
        <div className="w-1/2 flex flex-col">
          {/* Terminal Header */}
          <div className="bg-brand-surface border-b border-brand-border px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="text-brand-primary" size={18} />
              <span className="text-brand-primary text-sm font-bold">
                Generated Code
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-text-muted text-xs">
                {state.generated_code ? "COMPILING" : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Code Content */}
          <div
            ref={codeRef}
            className="flex-1 overflow-auto p-6 space-y-0.5 custom-scrollbar bg-white/40"
            style={{ scrollBehavior: "smooth" }}
          >
            {displayedCode ? (
              displayedCode.split('\n').map((line: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.05 }}
                  className="text-xs font-mono leading-relaxed"
                >
                  {/* Syntax highlighting with brand colors */}
                  {line.includes('<!DOCTYPE') || line.includes('<html') || line.includes('</html>') ? (
                    <span className="text-brand-primary font-bold">{line}</span>
                  ) : line.includes('<head') || line.includes('</head>') || line.includes('<body') || line.includes('</body>') ? (
                    <span className="text-brand-primary">{line}</span>
                  ) : line.includes('class=') ? (
                    <span className="text-brand-accent">{line}</span>
                  ) : line.includes('<script') || line.includes('</script>') ? (
                    <span className="text-purple-600">{line}</span>
                  ) : line.includes('<style') || line.includes('</style>') ? (
                    <span className="text-pink-600">{line}</span>
                  ) : line.trim().startsWith('<') ? (
                    <span className="text-text-primary">{line}</span>
                  ) : (
                    <span className="text-text-secondary">{line}</span>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Code className="text-brand-primary/50 animate-pulse" size={32} />
                <p className="text-text-muted text-sm">Awaiting code generation...</p>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-brand-primary/30 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="bg-brand-surface border-t border-brand-border px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="animate-pulse">▸</span>
              <span>
                Bytes: {displayedCode ? displayedCode.length : 0} |
                Status: {displayedCode.length < (state.generated_code?.length || 0) ? "STREAMING" : displayedCode.length > 1000 ? "FINALIZING" : "ASSEMBLING"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
