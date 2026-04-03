"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPapers, getSubscriptions } from "@/lib/api";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Topic } from "@/lib/types";

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(undefined);
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: topics } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["papers", { search, selectedTopic, minScore, page }],
    queryFn: () =>
      listPapers({
        search: search || undefined,
        topic_id: selectedTopic,
        min_score: minScore,
        page,
        per_page: 20,
      }),
    placeholderData: (prev) => prev,
  });

  const subscribedTopics = topics?.map((ut) => ut.topic) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Research Feed</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Latest papers from your subscribed topics, ranked by relevance.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          className="flex-1"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
            showFilters
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={cn("w-3 h-3 transition-transform", showFilters && "rotate-180")} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Topic</label>
            <select
              value={selectedTopic ?? ""}
              onChange={(e) => { setSelectedTopic(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Topics</option>
              {subscribedTopics.map((t: Topic) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Min Score: {minScore ?? 0}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={minScore ?? 0}
              onChange={(e) => { setMinScore(Number(e.target.value) || undefined); setPage(1); }}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSelectedTopic(undefined); setMinScore(undefined); setSearch(""); setPage(1); }}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 border border-gray-200"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {data && (
        <p className="text-xs text-gray-400 mb-4">
          {data.total} paper{data.total !== 1 ? "s" : ""} found
        </p>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-gray-500">Failed to load papers. Is the backend running?</p>
          <p className="text-sm text-gray-400 mt-1">
            Run: <code className="bg-gray-100 px-1 rounded">cd backend && uvicorn app.main:app --reload</code>
          </p>
        </div>
      )}

      {data?.items.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No papers found</p>
          <p className="text-sm text-gray-400 mt-1">Try syncing papers or adjusting your filters.</p>
        </div>
      )}

      <div className="grid gap-4">
        {data?.items.map((paper) => (
          <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>

      {data && data.total > data.per_page && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(data.total / data.per_page)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(data.total / data.per_page)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
