"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { highlightsApi } from "@/lib/api";
import { Highlight } from "@/types";
import HighlightCaptureModal from "@/components/HighlightCaptureModal";
import BookIcon from "@/components/BookIcon";

export default function HighlightsPage() {
  const queryClient = useQueryClient();
  const [captureOpen, setCaptureOpen] = useState(false);

  // ── Debounced search ──────────────────────────────────────────────────────
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const { data: allHighlights = [], isLoading: loadingAll } = useQuery({
    queryKey: ["myHighlights"],
    queryFn: highlightsApi.list,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["highlightSearch", debouncedQuery],
    queryFn: () => highlightsApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const remove = useMutation({
    mutationFn: (id: number) => highlightsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myHighlights"] });
      queryClient.invalidateQueries({ queryKey: ["highlightSearch"] });
    },
  });

  // Always render allHighlights when query is empty; otherwise show results.
  const showingSearch = debouncedQuery.length >= 2;
  const list = showingSearch ? searchResults : allHighlights;

  // Pre-compute count once for header text.
  const totalCount = useMemo(() => allHighlights.length, [allHighlights]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Highlights
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {totalCount === 0
              ? "Capture passages from your books and find them later by meaning."
              : `${totalCount} highlight${totalCount === 1 ? "" : "s"} saved · search by idea, not exact words`}
          </p>
        </div>
        <button
          onClick={() => setCaptureOpen(true)}
          className="nb-btn-primary shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          + New highlight
        </button>
      </header>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="Ask anything — &ldquo;decisions under uncertainty&rdquo;, &ldquo;stoicism&rdquo;…"
          className="nb-input w-full !pl-11 !pr-12 !py-3 text-sm"
        />
        {rawQuery && (
          <button
            onClick={() => setRawQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showingSearch && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {searching
            ? "Searching…"
            : `${searchResults.length} relevant highlight${
                searchResults.length === 1 ? "" : "s"
              } for “${debouncedQuery}”`}
        </p>
      )}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {loadingAll && !showingSearch ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="nb-skeleton h-32 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          searching={showingSearch}
          onAdd={() => setCaptureOpen(true)}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((h) => (
            <HighlightCard
              key={h.id}
              h={h}
              onDelete={() => remove.mutate(h.id)}
            />
          ))}
        </ul>
      )}

      <HighlightCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
    </div>
  );
}

// ─── Highlight card ───────────────────────────────────────────────────────────

function HighlightCard({
  h,
  onDelete,
}: {
  h: Highlight;
  onDelete: () => void;
}) {
  return (
    <li className="nb-card group relative flex gap-4 rounded-2xl p-4">
      {h.book.thumbnail ? (
        <Image
          src={h.book.thumbnail}
          alt={h.book.title}
          width={44}
          height={64}
          unoptimized
          className="h-16 w-11 shrink-0 rounded-md object-cover shadow-md shadow-zinc-900/15 ring-1 ring-black/5"
        />
      ) : (
        <div className="h-16 w-11 shrink-0 rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700" />
      )}

      <div className="min-w-0 flex-1">
        <blockquote className="border-l-2 border-amber-300/80 pl-3 text-sm leading-relaxed text-zinc-800 dark:border-amber-700/60 dark:text-zinc-100">
          {h.text}
        </blockquote>

        {h.note && (
          <p className="mt-2 text-xs italic text-zinc-500 dark:text-zinc-400">
            {h.note}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href={`/my-books`}
            className="font-medium text-zinc-700 hover:text-amber-700 hover:underline dark:text-zinc-200 dark:hover:text-amber-400"
          >
            {h.book.title}
          </Link>
          {h.pageNumber != null && (
            <>
              <span>·</span>
              <span>p. {h.pageNumber}</span>
            </>
          )}
          {h.relevance != null && (
            <>
              <span>·</span>
              <RelevanceBadge distance={h.relevance} />
            </>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="absolute right-3 top-3 hidden text-zinc-300 hover:text-red-400 group-hover:block dark:text-zinc-600 dark:hover:text-red-400"
        title="Delete"
      >
        ✕
      </button>
    </li>
  );
}

// Cosine distance → readable percentage. ~0 = perfect match, ~1 = unrelated.
function RelevanceBadge({ distance }: { distance: number }) {
  const score = Math.max(0, Math.min(1, 1 - distance / 2));
  const pct = Math.round(score * 100);
  return (
    <span className="rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      {pct}% match
    </span>
  );
}

function EmptyState({
  searching,
  onAdd,
}: {
  searching: boolean;
  onAdd: () => void;
}) {
  if (searching) {
    return (
      <div className="nb-surface flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No matches yet. Try a different phrasing — semantic search works on
          meaning, so vague queries often work better than exact words.
        </p>
      </div>
    );
  }
  return (
    <div className="nb-surface flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
      <BookIcon className="h-10 w-10 text-amber-400" />
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
        No highlights yet
      </h3>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Capture a passage from a book and you&apos;ll be able to find it later
        by meaning, even if you don&apos;t remember the exact words.
      </p>
      <button
        onClick={onAdd}
        className="nb-btn-primary mt-2 rounded-lg px-4 py-2 text-sm font-semibold"
      >
        Save your first highlight
      </button>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
