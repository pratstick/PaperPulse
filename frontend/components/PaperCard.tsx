"use client";

import Link from "next/link";
import { ExternalLink, Bookmark, BookCheck, Star } from "lucide-react";
import { cn, formatDate, scoreLabel, truncate } from "@/lib/utils";
import type { Paper } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePaperState } from "@/lib/api";

interface PaperCardProps {
  paper: Paper;
  compact?: boolean;
}

export function PaperCard({ paper, compact = false }: PaperCardProps) {
  const qc = useQueryClient();
  const score = scoreLabel(paper.importance_score);

  const stateMutation = useMutation({
    mutationFn: (state: { is_saved?: boolean; is_read?: boolean }) =>
      updatePaperState(paper.id, state),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["papers"] });
      qc.invalidateQueries({ queryKey: ["digest"] });
      qc.invalidateQueries({ queryKey: ["paper", paper.id] });
    },
  });

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow",
        paper.is_read && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/papers/${paper.id}`}
            className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors line-clamp-2 text-sm leading-snug"
          >
            {paper.title}
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {paper.authors.slice(0, 3).join(", ")}
            {paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : ""}
          </p>
        </div>
        {/* Score badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-gray-700">{Math.round(paper.importance_score)}</span>
          </div>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", score.color)}>
            {score.label}
          </span>
        </div>
      </div>

      {/* Topic tags */}
      {paper.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {paper.topics.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium"
            >
              {t.icon && <span>{t.icon}</span>}
              {t.display_name}
            </span>
          ))}
        </div>
      )}

      {/* Abstract / summary */}
      {!compact && (
        <div className="text-sm text-gray-600 leading-relaxed">
          {paper.summary ? (
            <p>{truncate(paper.summary.summary, 200)}</p>
          ) : (
            <p className="text-gray-400 italic">{truncate(paper.abstract, 200)}</p>
          )}
        </div>
      )}

      {/* Why it matters */}
      {!compact && paper.summary?.why_it_matters && (
        <div className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
          💡 {paper.summary.why_it_matters}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(paper.published_at)}</span>
        <div className="flex items-center gap-1">
          {paper.arxiv_url && (
            <a
              href={paper.arxiv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              title="Open on arXiv"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => stateMutation.mutate({ is_saved: !paper.is_saved })}
            disabled={stateMutation.isPending}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              paper.is_saved
                ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
            title={paper.is_saved ? "Unsave" : "Save for later"}
          >
            <Bookmark className={cn("w-3.5 h-3.5", paper.is_saved && "fill-indigo-600")} />
          </button>
          <button
            onClick={() => stateMutation.mutate({ is_read: !paper.is_read })}
            disabled={stateMutation.isPending}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              paper.is_read
                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
            title={paper.is_read ? "Mark unread" : "Mark as read"}
          >
            <BookCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
