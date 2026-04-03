"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaper, getRelatedPapers, updatePaperState } from "@/lib/api";
import { formatDate, scoreLabel, cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { PaperCard } from "@/components/PaperCard";
import { ExternalLink, Bookmark, BookCheck, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const paperId = Number(id);
  const qc = useQueryClient();

  const { data: paper, isLoading } = useQuery({
    queryKey: ["paper", paperId],
    queryFn: () => getPaper(paperId),
  });

  const { data: related } = useQuery({
    queryKey: ["related", paperId],
    queryFn: () => getRelatedPapers(paperId),
    enabled: !!paper,
  });

  const stateMutation = useMutation({
    mutationFn: (state: { is_saved?: boolean; is_read?: boolean }) =>
      updatePaperState(paperId, state),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paper", paperId] });
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-gray-500">Paper not found.</p>
        <Link href="/" className="text-indigo-600 text-sm mt-2 inline-block">← Back to feed</Link>
      </div>
    );
  }

  const score = scoreLabel(paper.importance_score);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <ScoreBadge score={paper.importance_score} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{paper.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {paper.authors.join(", ")}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-gray-400">{formatDate(paper.published_at)}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", score.color)}>
              {score.label}
            </span>
            {paper.topics.map((t) => (
              <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                {t.icon} {t.display_name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-8">
        {paper.arxiv_url && (
          <a
            href={paper.arxiv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on arXiv
          </a>
        )}
        {paper.pdf_url && (
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </a>
        )}
        <button
          onClick={() => stateMutation.mutate({ is_saved: !paper.is_saved })}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
            paper.is_saved
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <Bookmark className={cn("w-4 h-4", paper.is_saved && "fill-indigo-600")} />
          {paper.is_saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => stateMutation.mutate({ is_read: !paper.is_read })}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
            paper.is_read
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <BookCheck className="w-4 h-4" />
          {paper.is_read ? "Read" : "Mark Read"}
        </button>
      </div>

      {/* Summary */}
      {paper.summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">AI Summary</h2>
          <p className="text-gray-700 leading-relaxed text-sm">{paper.summary.summary}</p>

          {paper.summary.key_contributions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Key Contributions
              </h3>
              <ul className="space-y-1">
                {paper.summary.key_contributions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {paper.summary.practical_relevance && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-xs font-semibold text-blue-700 mb-1">Practical Relevance</h3>
              <p className="text-sm text-blue-800">{paper.summary.practical_relevance}</p>
            </div>
          )}

          {paper.summary.limitations && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <h3 className="text-xs font-semibold text-amber-700 mb-1">Limitations</h3>
              <p className="text-sm text-amber-800">{paper.summary.limitations}</p>
            </div>
          )}

          {paper.summary.why_it_matters && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
              <h3 className="text-xs font-semibold text-indigo-700 mb-1">Why It Matters</h3>
              <p className="text-sm text-indigo-800">{paper.summary.why_it_matters}</p>
            </div>
          )}
        </div>
      )}

      {/* Abstract */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Abstract</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{paper.abstract}</p>
      </div>

      {/* Related papers */}
      {related && related.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Related Papers</h2>
          <div className="grid gap-3">
            {related.map((p) => (
              <PaperCard key={p.id} paper={p} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
