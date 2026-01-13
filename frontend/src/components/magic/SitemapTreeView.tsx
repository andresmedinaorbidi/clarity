"use client";
import React from "react";
import { FileText, ChevronRight } from "lucide-react";
import { SitemapPage } from "@/hooks/use-orchestrator";

interface SitemapTreeViewProps {
  sitemap: SitemapPage[];
}

export default function SitemapTreeView({ sitemap }: SitemapTreeViewProps) {
  if (!sitemap || sitemap.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        No sitemap available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sitemap.map((page, i) => (
        <div key={i} className="group">
          {/* Page Level */}
          <div className="flex items-start gap-3 py-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <FileText className="text-brand-primary" size={18} />
              <span className="text-lg font-bold text-brand-primary">
                {page.title}
              </span>
            </div>
          </div>

          {/* Sections Level (Indented) */}
          {page.sections && page.sections.length > 0 && (
            <div className="ml-8 space-y-1.5 mt-1">
              {page.sections.map((section, j) => (
                <div key={j} className="flex items-center gap-2 py-1">
                  {/* Tree connector */}
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-px bg-brand-border ${
                        j === page.sections!.length - 1 ? "" : "relative"
                      }`}
                    >
                      {j !== page.sections!.length - 1 && (
                        <div className="absolute left-0 top-0 w-px h-6 bg-brand-border" />
                      )}
                    </div>
                    <ChevronRight className="text-brand-border" size={14} />
                  </div>
                  <span className="text-sm text-text-secondary">
                    {section}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Purpose (Sub-text) */}
          {page.purpose && (
            <div className="ml-8 mt-1">
              <p className="text-xs text-text-muted italic">
                {page.purpose}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
