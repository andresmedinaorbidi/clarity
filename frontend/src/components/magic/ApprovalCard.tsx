"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Edit3 } from "lucide-react";
import { SitemapPage } from "@/hooks/use-orchestrator";
import SitemapTreeView from "./SitemapTreeView";

interface ApprovalCardProps {
  type: "direction" | "structure";
  directionSnapshot?: string;
  sitemap?: SitemapPage[];
  onApprove: () => void;
  onEdit: (feedback: string) => void;
}

export default function ApprovalCard({
  type,
  directionSnapshot,
  sitemap,
  onApprove,
  onEdit,
}: ApprovalCardProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFeedback, setEditFeedback] = useState("");

  const handleEdit = () => {
    if (editFeedback.trim()) {
      onEdit(editFeedback);
      setEditFeedback("");
      setShowEditForm(false);
    }
  };

  // Direction Lock Card (GATE A)
  if (type === "direction") {
    return (
      <div className="max-w-3xl mx-auto p-12 my-12">
        {/* Glass morphism card with subtle glow */}
        <div
          className="relative rounded-3xl p-12 overflow-hidden"
          style={{
            background: 'rgba(248, 249, 250, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(96, 37, 159, 0.2)',
            boxShadow: '0 0 40px rgba(96, 37, 159, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-primary/10 rounded-2xl">
                <span className="text-4xl">🎯</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-brand-primary tracking-tight">
                  Strategic Direction
                </h2>
                <p className="text-sm text-text-muted mt-1 uppercase tracking-wider font-bold">
                  Gate A - Approval Required
                </p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none mb-10 text-text-primary leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {directionSnapshot || "*No direction snapshot available*"}
              </ReactMarkdown>
            </div>

            {!showEditForm ? (
              <div className="flex gap-4">
                <button
                  onClick={onApprove}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-lg hover:shadow-brand-primary/30"
                >
                  <CheckCircle2 size={20} />
                  Looks Perfect - Continue
                </button>
                <button
                  onClick={() => setShowEditForm(true)}
                  className="bg-white/80 hover:bg-white border border-brand-border text-text-primary font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-[1.01]"
                >
                  <Edit3 size={18} />
                  Refine Direction
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  placeholder="What would you like to change about the direction?"
                  className="w-full p-4 bg-white/80 border border-brand-border rounded-xl text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none min-h-[120px] transition-all"
                  autoFocus
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleEdit}
                    disabled={!editFeedback.trim()}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  >
                    Submit Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditFeedback("");
                    }}
                    className="bg-white/80 hover:bg-white border border-brand-border text-text-primary font-bold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Structure Confirm Card (GATE B)
  if (type === "structure") {
    return (
      <div className="max-w-5xl mx-auto p-12 my-12">
        {/* Glass morphism card with subtle glow */}
        <div
          className="relative rounded-3xl p-12 overflow-hidden"
          style={{
            background: 'rgba(248, 249, 250, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(96, 37, 159, 0.2)',
            boxShadow: '0 0 40px rgba(96, 37, 159, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-brand-primary/10 rounded-2xl">
                <span className="text-4xl">🏗️</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-brand-primary tracking-tight">
                  Site Structure
                </h2>
                <p className="text-sm text-text-muted mt-1 uppercase tracking-wider font-bold">
                  Gate B - {sitemap?.length || 0} Pages Designed
                </p>
              </div>
            </div>

            {/* Sitemap Tree View */}
            <div
              className="mb-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 p-6 rounded-xl bg-white/40"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <SitemapTreeView sitemap={sitemap || []} />
            </div>

            {!showEditForm ? (
              <div className="flex gap-4">
                <button
                  onClick={onApprove}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-lg hover:shadow-brand-primary/30"
                >
                  <CheckCircle2 size={20} />
                  Structure Looks Great
                </button>
                <button
                  onClick={() => setShowEditForm(true)}
                  className="bg-white/80 hover:bg-white border border-brand-border text-text-primary font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-[1.01]"
                >
                  <Edit3 size={18} />
                  Modify Structure
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  placeholder="What changes would you like to make to the structure? (e.g., 'add a blog page', 'remove the about section')"
                  className="w-full p-4 bg-white/80 border border-brand-border rounded-xl text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none min-h-[120px] transition-all"
                  autoFocus
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleEdit}
                    disabled={!editFeedback.trim()}
                    className="flex-1 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  >
                    Submit Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditFeedback("");
                    }}
                    className="bg-white/80 hover:bg-white border border-brand-border text-text-primary font-bold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
