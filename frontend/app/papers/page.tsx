"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listPapers } from "@/lib/api";
import { PaperCard } from "@/components/PaperCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { Bookmark, BookOpen } from "lucide-react";

function PapersContent() {
  const searchParams = useSearchParams();
  const isSavedView = searchParams.get("is_saved") === "true";
  const isReadView = searchParams.get("is_read") === "true";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["papers", { search, isSavedView, isReadView, page }],
    queryFn: () =>
      listPapers({
        search: search || undefined,
        is_saved: isSavedView ? true : undefined,
        is_read: isReadView ? true : undefined,
        page,
        per_page: 20,
      }),
    placeholderData: (prev) => prev,
  });

  const title = isSavedView ? "Saved Papers" : isReadView ? "Read Papers" : "Papers";
  const description = isSavedView
    ? "Papers you've saved for later reading."
    : isReadView
    ? "Papers you've already read."
    : "All papers.";
  const Icon = isSavedView ? Bookmark : BookOpen;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          className="max-w-md"
        />
      </div>

      {data && (
        <p className="text-xs text-gray-400 mb-4">
          {data.total} paper{data.total !== 1 ? "s" : ""}
        </p>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-gray-500">Failed to load papers. Is the backend running?</p>
        </div>
      )}

      {data?.items.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">{isSavedView ? "🔖" : "📖"}</p>
          <p className="text-gray-500 font-medium">
            {isSavedView ? "No saved papers yet." : isReadView ? "No read papers yet." : "No papers found."}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isSavedView || isReadView
              ? "Use the save and read buttons on any paper card."
              : "Try syncing papers from the sidebar."}
          </p>
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

export default function PapersPage() {
  return (
    <Suspense>
      <PapersContent />
    </Suspense>
  );
}
