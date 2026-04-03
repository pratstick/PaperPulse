"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodayDigest } from "@/lib/api";
import { PaperCard } from "@/components/PaperCard";
import { Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DigestPage() {
  const { data: digest, isLoading, isError } = useQuery({
    queryKey: ["digest"],
    queryFn: getTodayDigest,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !digest) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center py-16">
        <p className="text-gray-500">Failed to load digest. Is the backend running?</p>
      </div>
    );
  }

  const savedPapers = digest.papers.filter((p) => p.is_saved);
  const readPapers = digest.papers.filter((p) => p.is_read);
  const unreadPapers = digest.papers.filter((p) => !p.is_read);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(digest.date)}</span>
          <span className="text-gray-300">·</span>
          <Clock className="w-4 h-4" />
          <span>{digest.estimated_read_minutes} min read</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Digest</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {digest.papers.length} top papers curated from your interests.
        </p>
      </div>

      {digest.papers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No papers in today&apos;s digest yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Sync papers from the sidebar to populate your digest.
          </p>
        </div>
      )}

      {/* Unread section */}
      {unreadPapers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            To Read ({unreadPapers.length})
          </h2>
          <div className="grid gap-4">
            {unreadPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {/* Saved section */}
      {savedPapers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Saved for Later ({savedPapers.length})
          </h2>
          <div className="grid gap-4">
            {savedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} compact />
            ))}
          </div>
        </section>
      )}

      {/* Read section */}
      {readPapers.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Already Read ({readPapers.length})
          </h2>
          <div className="grid gap-4 opacity-60">
            {readPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
