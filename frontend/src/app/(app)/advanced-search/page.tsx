"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi, AdvancedSearchParams, OrderBy, PrintType } from "@/lib/api";
import { BookSearchResult } from "@/types";
import BookDetailModal from "@/components/BookDetailModal";
import AddToLibraryButton from "@/components/AddToLibraryButton";

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasAnyFilter(params: AdvancedSearchParams) {
  return !!(params.q || params.author || params.publisher || params.subject);
}

// ── Book result card ─────────────────────────────────────────────────────────

function BookResultCard({
  book,
  isAdding,
  isAdded,
  onAdd,
  onOpenDetail,
}: {
  book: BookSearchResult;
  isAdding: boolean;
  isAdded: boolean;
  onAdd: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <div className="nb-card flex gap-3 rounded-2xl p-4">
      {book.thumbnail ? (
        <Image
          src={book.thumbnail}
          alt={book.title}
          width={48}
          height={70}
          unoptimized
          className="h-[70px] w-12 shrink-0 rounded-md object-cover shadow-md shadow-zinc-900/15 ring-1 ring-black/5"
        />
      ) : (
        <div className="h-[70px] w-12 shrink-0 rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700" />
      )}

      <div className="min-w-0 flex-1">
        <button
          onClick={onOpenDetail}
          className="line-clamp-2 text-left text-sm font-semibold leading-snug text-zinc-800 hover:text-amber-700 hover:underline dark:text-zinc-100 dark:hover:text-amber-400"
        >
          {book.title}
        </button>
        {book.authors?.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {book.authors.join(", ")}
          </p>
        )}
        {book.publishedDate && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            {book.publishedDate.slice(0, 4)}
          </p>
        )}
        {book.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {book.description}
          </p>
        )}
        <AddToLibraryButton isAdding={isAdding} isAdded={isAdded} onAdd={onAdd} />
      </div>
    </div>
  );
}

// ── Label + input wrapper ────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = "nb-input";
const selectClass = "nb-input";

// ── Main inner component ─────────────────────────────────────────────────────

function AdvancedSearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [subject, setSubject] = useState("");
  const [printType, setPrintType] = useState<PrintType>("BOOKS");
  const [orderBy, setOrderBy] = useState<OrderBy>("RELEVANCE");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [activeParams, setActiveParams] = useState<AdvancedSearchParams | null>(
    searchParams.get("q") ? { q: searchParams.get("q")!, printType: "BOOKS", orderBy: "RELEVANCE", page: 0, size: pageSize } : null
  );

  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["advancedSearch", activeParams],
    queryFn: () => booksApi.searchAdvanced(activeParams!),
    enabled: activeParams !== null && hasAnyFilter(activeParams),
  });

  const addBook = useMutation({
    mutationFn: (googleBooksId: string) =>
      userBooksApi.add(googleBooksId, "TO_READ"),
    onSuccess: (_, googleBooksId) => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      setAddedIds((prev) => new Set(prev).add(googleBooksId));
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setActiveParams({ q: query, author, publisher, subject, printType, orderBy, page: 0, size: pageSize });
  }

  function handleAdd(googleBooksId: string) {
    addBook.mutate(googleBooksId);
    setSelectedBook(null);
  }

  function handlePageChange(next: number) {
    setPage(next);
    setActiveParams((prev) => prev ? { ...prev, page: next } : prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleClear() {
    setQuery("");
    setAuthor("");
    setPublisher("");
    setSubject("");
    setPrintType("BOOKS");
    setOrderBy("RELEVANCE");
    setPage(0);
    setActiveParams(null);
  }

  const hasResults = !isFetching && results.length > 0;
  const isLastPage = results.length < pageSize;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Advanced Search</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Filter books by author, publisher, subject, and more</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        {/* ── Filter panel ─────────────────────────────────────────────────── */}
        <aside>
          <form
            onSubmit={handleSearch}
            className="nb-surface rounded-2xl p-5"
          >
            <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Filters
            </h2>

            <div className="flex flex-col gap-4">
              <Field label="Keywords">
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 4.65 4.65a7.5 7.5 0 0 0 12 12z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. mistborn, dune…"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Author">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Brandon Sanderson"
                  className={inputClass}
                />
              </Field>

              <Field label="Publisher">
                <input
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Tor Books"
                  className={inputClass}
                />
              </Field>

              <Field label="Subject / Genre">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. fantasy, science"
                  className={inputClass}
                />
              </Field>

              <Field label="Type">
                <select
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value as PrintType)}
                  className={selectClass}
                >
                  <option value="BOOKS">Books</option>
                  <option value="MAGAZINES">Magazines</option>
                  <option value="ALL">All</option>
                </select>
              </Field>

              <Field label="Sort by">
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value as OrderBy)}
                  className={selectClass}
                >
                  <option value="RELEVANCE">Relevance</option>
                  <option value="NEWEST">Newest first</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="submit"
                className="nb-btn-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 4.65 4.65a7.5 7.5 0 0 0 12 12z" />
                </svg>
                Search
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Clear filters
              </button>
            </div>
          </form>
        </aside>

        {/* ── Results panel ────────────────────────────────────────────────── */}
        <section>
          {/* Idle state */}
          {activeParams === null && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-300/60 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-zinc-300 dark:text-zinc-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 4.65 4.65a7.5 7.5 0 0 0 12 12z" />
              </svg>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Fill in the filters and press Search</p>
            </div>
          )}

          {/* Loading skeleton */}
          {isFetching && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="nb-surface flex gap-3 rounded-2xl p-4">
                  <div className="nb-skeleton h-[70px] w-12 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="nb-skeleton h-4 w-3/4" />
                    <div className="nb-skeleton h-3 w-1/2" />
                    <div className="nb-skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isFetching && isError && (
            <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
          )}

          {/* No results */}
          {activeParams !== null && !isFetching && !isError && results.length === 0 && (
            <div className="nb-surface flex h-40 items-center justify-center rounded-2xl">
              <p className="text-sm text-zinc-400">No books found. Try adjusting your filters.</p>
            </div>
          )}

          {/* Results grid */}
          {hasResults && (
            <>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                {results.length} result{results.length !== 1 ? "s" : ""} — page {page + 1}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.map((book: BookSearchResult) => (
                  <BookResultCard
                    key={book.googleBooksId}
                    book={book}
                    isAdding={addBook.isPending && addBook.variables === book.googleBooksId}
                    isAdded={addedIds.has(book.googleBooksId)}
                    onAdd={() => handleAdd(book.googleBooksId)}
                    onOpenDetail={() => setSelectedBook(book)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Previous
                </button>
                <span className="text-sm text-zinc-400 dark:text-zinc-500">Page {page + 1}</span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={isLastPage}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {selectedBook && (
            <BookDetailModal
              book={selectedBook}
              onClose={() => setSelectedBook(null)}
              isAdding={addBook.isPending && addBook.variables === selectedBook.googleBooksId}
              isAdded={addedIds.has(selectedBook.googleBooksId)}
              onAdd={() => handleAdd(selectedBook.googleBooksId)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense>
      <AdvancedSearchInner />
    </Suspense>
  );
}
