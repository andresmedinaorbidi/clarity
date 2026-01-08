"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Code, Zap } from "lucide-react";

export default function EngineeringStream({ state }: any) {
  const [prdScroll, setPrdScroll] = useState(0);
  const [codeScroll, setCodeScroll] = useState(0);
  const prdRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll PRD panel
  useEffect(() => {
    if (prdRef.current && state.prd_document) {
      const interval = setInterval(() => {
        setPrdScroll((prev) => {
          const maxScroll = prdRef.current!.scrollHeight - prdRef.current!.clientHeight;
          if (prev >= maxScroll) return prev;
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [state.prd_document]);

  // Auto-scroll code panel as it streams
  useEffect(() => {
    if (codeRef.current && state.generated_code) {
      const maxScroll = codeRef.current.scrollHeight - codeRef.current.clientHeight;
      setCodeScroll(maxScroll);
    }
  }, [state.generated_code]);

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
      className="fixed inset-0 bg-black text-green-400 overflow-hidden font-mono"
    >
      {/* Matrix-style background effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent" />
      </div>

      {/* Main Split Layout */}
      <div className="relative h-full flex">
        {/* LEFT PANEL: The Blueprint (PRD) */}
        <div className="w-1/2 border-r border-green-500/30 flex flex-col">
          {/* Terminal Header */}
          <div className="bg-black/90 border-b border-green-500/30 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-green-400" size={18} />
              <span className="text-green-400 text-sm font-bold">
                &gt; EXECUTING_TECH_SPEC.md
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400/60 text-xs">PROCESSING</span>
            </div>
          </div>

          {/* PRD Content */}
          <div
            ref={prdRef}
            className="flex-1 overflow-auto p-6 space-y-2 custom-scrollbar"
            style={{ scrollBehavior: "auto" }}
          >
            {state.prd_document ? (
              state.prd_document.split('\n').map((line: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.01, duration: 0.2 }}
                  className="text-sm leading-relaxed"
                >
                  {line.startsWith('#') ? (
                    <span className="text-cyan-400 font-bold">{line}</span>
                  ) : line.startsWith('-') || line.startsWith('*') ? (
                    <span className="text-green-300">{line}</span>
                  ) : (
                    <span className="text-green-400/80">{line}</span>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Zap className="text-green-400 animate-pulse" size={32} />
                <p className="text-green-400/60 text-sm">AWAITING TECHNICAL SPECIFICATIONS...</p>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="bg-black/90 border-t border-green-500/30 px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-green-400/60">
              <span className="animate-pulse">▓</span>
              <span>
                Lines: {state.prd_document ? state.prd_document.split('\n').length : 0} |
                Status: {state.current_step === "prd" ? "STREAMING" : "COMPLETE"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: The Construction (Generated Code) */}
        <div className="w-1/2 flex flex-col">
          {/* Terminal Header */}
          <div className="bg-black/90 border-b border-cyan-500/30 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="text-cyan-400" size={18} />
              <span className="text-cyan-400 text-sm font-bold">
                &gt; ASSEMBLING_COMPONENTS.html
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400/60 text-xs">
                {state.generated_code ? "COMPILING" : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Code Content */}
          <div
            ref={codeRef}
            className="flex-1 overflow-auto p-6 space-y-1 custom-scrollbar"
            style={{ scrollBehavior: "smooth" }}
          >
            {state.generated_code ? (
              state.generated_code.split('\n').map((line: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className="text-sm font-mono leading-relaxed"
                >
                  {/* Syntax highlighting simulation */}
                  {line.includes('<!DOCTYPE') || line.includes('<html') || line.includes('</html>') ? (
                    <span className="text-cyan-300">{line}</span>
                  ) : line.includes('<head') || line.includes('</head>') || line.includes('<body') || line.includes('</body>') ? (
                    <span className="text-cyan-400">{line}</span>
                  ) : line.includes('class=') ? (
                    <span className="text-yellow-400/80">{line}</span>
                  ) : line.includes('<script') || line.includes('</script>') ? (
                    <span className="text-purple-400">{line}</span>
                  ) : line.includes('<style') || line.includes('</style>') ? (
                    <span className="text-pink-400">{line}</span>
                  ) : line.trim().startsWith('<') ? (
                    <span className="text-green-300">{line}</span>
                  ) : (
                    <span className="text-white/60">{line}</span>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Code className="text-cyan-400/50 animate-pulse" size={32} />
                <p className="text-cyan-400/60 text-sm">AWAITING CODE GENERATION...</p>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="bg-black/90 border-t border-cyan-500/30 px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-cyan-400/60">
              <span className="animate-pulse">▓</span>
              <span>
                Bytes: {state.generated_code ? state.generated_code.length : 0} |
                Status: {state.generated_code && state.generated_code.length > 1000 ? "FINALIZING" : "ASSEMBLING"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[length:100%_4px] animate-[scanline_8s_linear_infinite]" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>
    </motion.div>
  );
}
