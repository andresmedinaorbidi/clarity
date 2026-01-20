"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, Layout, FileText } from "lucide-react";
import { WebsiteState } from "@/hooks/use-orchestrator";
import { useAdvancedMode } from "@/contexts/AdvancedModeContext";

interface VisualSitemapProps {
  state: WebsiteState;
}

interface SitemapPage {
  title: string;
  purpose?: string;
  sections?: string[];
  [key: string]: any; // Allow other properties for backend use
}

export default function VisualSitemap({ state }: VisualSitemapProps) {
  const { isAdvancedMode } = useAdvancedMode();
  const sitemap = (state.sitemap || []) as SitemapPage[];

  // Group pages by hierarchy (simple: first page is home, others are top-level)
  const homePage = sitemap[0];
  const topLevelPages = sitemap.slice(1);

  // Get navigation items (limit to 5 for clean display)
  const navItems = topLevelPages.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-3">
          <Map className="text-brand-primary" size={28} />
          <h2 className="text-3xl font-black text-brand-primary">Website Structure</h2>
        </div>
        <p className="text-sm text-text-secondary">
          {sitemap.length} {sitemap.length === 1 ? "page" : "pages"} planned
        </p>
      </motion.div>

      {/* Web Mockup - Simple Grey Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Browser Bar */}
        <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="w-3 h-3 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 text-center">
            {state.project_name || "Your Website"}
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Home/Logo */}
            {homePage && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gray-400 rounded" />
                <span className="text-sm font-bold text-gray-700">{homePage.title}</span>
              </motion.div>
            )}
            
            {/* Navigation Links */}
            <div className="flex-1 flex items-center gap-4 ml-6">
              {navItems.map((page, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-2.5 bg-gray-400 rounded w-20" />
                </motion.div>
              ))}
              {topLevelPages.length > 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="h-2.5 bg-gray-300 rounded w-12"
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Page Grid */}
        <div className="p-6 md:p-8 bg-gray-50 min-h-[400px]">
          <div 
            className="grid gap-3 md:gap-4"
            style={{ 
              gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`
            }}
          >
            {sitemap.map((page, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                className="bg-white border-2 border-gray-300 rounded-lg p-4 space-y-3 hover:border-gray-400 transition-colors"
              >
                {/* Page Header */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded flex-shrink-0" />
                  <div className="flex-1 h-3 bg-gray-300 rounded" />
                </div>
                
                {/* Page Title */}
                <div className="h-4 bg-gray-400 rounded w-3/4" />
                
                {/* Content Blocks */}
                <div className="space-y-2 flex-1">
                  {page.sections && page.sections.length > 0 ? (
                    page.sections.slice(0, 4).map((_, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="h-2.5 bg-gray-200 rounded"
                        style={{ width: `${100 - sIdx * 10}%` }}
                      />
                    ))
                  ) : (
                    <>
                      <div className="h-2.5 bg-gray-200 rounded w-full" />
                      <div className="h-2.5 bg-gray-200 rounded w-5/6" />
                      <div className="h-2.5 bg-gray-200 rounded w-4/6" />
                      <div className="h-2.5 bg-gray-200 rounded w-3/6" />
                    </>
                  )}
                </div>

                {/* Page Label */}
                <div className="pt-2 border-t border-gray-200 mt-auto">
                  <p className="text-xs font-bold text-gray-700 truncate">{page.title}</p>
                  {page.purpose && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{page.purpose}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-200 border-t border-gray-300 px-6 py-4">
          <div className="flex items-center justify-center gap-6">
            {Array.from({ length: Math.min(4, topLevelPages.length) }).map((_, i) => (
              <div key={i} className="h-2 bg-gray-400 rounded w-16" />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Page List - Simplified View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Layout className="text-brand-primary" size={20} />
          <h3 className="text-lg font-black text-brand-primary">Pages Overview</h3>
        </div>
        
        <div className="grid gap-3">
          {sitemap.map((page, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-3 p-3 bg-brand-dark rounded-lg border border-brand-border hover:border-brand-primary/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-primary">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{page.title}</p>
                {page.purpose && (
                  <p className="text-xs text-text-secondary truncate mt-0.5">{page.purpose}</p>
                )}
              </div>
              {page.sections && page.sections.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <span>{page.sections.length}</span>
                  <span className="text-[10px]">sections</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Advanced Mode: Full Technical Details */}
      {isAdvancedMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-lg font-black text-brand-primary">Full Sitemap Data (Advanced)</h3>
          <div className="bg-brand-dark border border-brand-border rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-text-secondary font-mono">
              {JSON.stringify(sitemap, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}
