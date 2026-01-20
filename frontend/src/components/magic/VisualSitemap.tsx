"use client";
import React, { useMemo, useState } from "react";
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
  
  // State to track selected page (default to first page/home)
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  
  const selectedPage = sitemap[selectedPageIndex] || null;

  return (
    <div className="space-y-8">

      {/* Web Mockup - White Background with Green Shades */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border-2 border-brand-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 10px 30px -5px rgba(190, 255, 80, 0.2)' }}
      >
        {/* Browser Bar */}
        <div className="bg-white border-b border-brand-border px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="w-3 h-3 rounded-full bg-gray-400" />
          </div>
          <div className="flex-1 bg-brand-surface rounded px-3 py-1 text-xs text-text-secondary text-center">
            {state.project_name || "Your Website"}
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-brand-secondary/20 border-b border-brand-border px-6 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gray-400 rounded" />
              <span className="text-sm font-bold text-text-primary">{state.project_name || "Logo"}</span>
            </div>
            
            {/* Navigation Links - All Pages */}
            <div className="flex-1 flex items-center gap-2 ml-6 flex-wrap">
              {sitemap.map((page, i) => {
                const isActive = selectedPageIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedPageIndex(i)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? "bg-brand-primary text-text-primary" 
                        : "text-text-secondary hover:text-text-primary hover:bg-white/50"
                      }
                    `}
                  >
                    {page.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area - Selected Page View */}
        <div className="p-6 md:p-8 bg-white min-h-[400px]">
          {selectedPage ? (
            <motion.div
              key={selectedPageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Page Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary">{selectedPage.title}</h2>
                {selectedPage.purpose && (
                  <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                    {selectedPage.purpose}
                  </p>
                )}
              </div>

              {/* Sections */}
              {selectedPage.sections && selectedPage.sections.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-primary uppercase tracking-wide">Sections</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedPage.sections.map((section: string, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-4 border border-gray-300 rounded-lg space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-300 rounded flex-shrink-0" />
                          <div className="flex-1 h-3 bg-gray-300 rounded" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">{section}</p>
                        <div className="space-y-1.5">
                          <div className="h-2 bg-gray-200 rounded w-full" />
                          <div className="h-2 bg-gray-200 rounded w-5/6" />
                          <div className="h-2 bg-gray-200 rounded w-4/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Placeholders */}
              <div className="space-y-4 pt-4 border-t border-brand-border/50">
                <div className="space-y-3">
                  <div className="h-8 bg-gray-300 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-24 bg-gray-200 rounded-lg" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-text-secondary">Select a page from the navigation</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-brand-secondary/20 border-t border-brand-border px-6 py-4">
          <div className="flex items-center justify-center gap-6">
            {Array.from({ length: Math.min(4, sitemap.length - 1) }).map((_, i) => (
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
          <h3 className="text-sm font-medium text-text-primary">Pages Overview</h3>
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
          <h3 className="text-sm font-medium text-text-primary">Full Sitemap Data (Advanced)</h3>
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
