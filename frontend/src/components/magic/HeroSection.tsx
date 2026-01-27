// src/components/magic/HeroSection.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Instagram, MapPin, Globe } from "lucide-react";
import { useTypingPlaceholder } from "./useTypingPlaceholder";

interface HeroSectionProps {
  onStart: (input: string) => void;
  loading: boolean;
}

export default function HeroSection({ onStart, loading }: HeroSectionProps) {
  const [input, setInput] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animated placeholder - continue cycling when input is empty, even if focused
  const placeholderText = useTypingPlaceholder(input.length === 0);

  // Parallax effect for gradient background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // Max 20px movement
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      // Deliberate delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 100));
      onStart(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Background glow reaction to typing
  const glowIntensity = input.length > 0 ? Math.min(1, input.length / 20) : 0;

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden hero-gradient-bg noise-texture"
    >
      {/* Parallax gradient blobs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[150px] pointer-events-none"
        animate={{
          x: mousePosition.x * 0.5,
          y: mousePosition.y * 0.5,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-primary/8 rounded-full blur-[180px] pointer-events-none"
        animate={{
          x: mousePosition.x * -0.3,
          y: mousePosition.y * -0.3,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />

      {/* Reactive background glow when typing */}
      <motion.div
        className="absolute inset-0 bg-brand-primary/5 pointer-events-none"
        animate={{
          opacity: glowIntensity * 0.3,
        }}
        transition={{ duration: 0.3 }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl text-center space-y-8"
      >
        <div className="space-y-6">
          {/* Emotional Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-tight"
          >
            Your website<br />
            imagined for you.
          </motion.h1>

          {/* Supporting Microcopy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-text-secondary text-sm md:text-base max-w-xl mx-auto"
          >
            Powered by your data from Instagram, Google, and the web.
          </motion.p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative group">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <input
              autoFocus
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={placeholderText || "Tell us about your business..."}
              className="w-full bg-white border border-brand-border rounded-2xl py-6 pl-8 pr-32 text-lg md:text-xl text-text-primary outline-none input-glow-focus placeholder:text-text-muted shadow-xl transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 top-3 bottom-3 px-6 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border disabled:text-text-muted text-text-primary rounded-xl font-medium transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Thinking..." : "Create my website"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </form>

        {/* Data Intelligence Signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="data-source-icons"
        >
          <div className="flex items-center gap-2 text-text-secondary text-xs">
            <Instagram size={16} className="data-source-icon" />
            <MapPin size={16} className="data-source-icon" />
            <Globe size={16} className="data-source-icon" />
            <span className="ml-1">Uses Instagram, Google Business, and public data</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
