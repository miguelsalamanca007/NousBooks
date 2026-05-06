"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import { BookSearchResult } from "@/types";

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const q = params.get("q") ?? "";

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["bookSearch", q],
    queryFn: () => booksApi.search(q),
    enabled: q.length > 2,
  });

  const addBook = useMutation({
    mutationFn: (googleBooksId: string) =>
      userBooksApi.add(googleBooksId, "TO_READ"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back
        </button>

        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Search results
          </h1>
          {q && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Results for &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* States */}
      {q.length <= 2 && (
        <p className="text-sm text-zinc-400">
          Type at least 3 characters to search.
        </p>
      )}

      {q.length > 2 && isFetching && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-24 w-16 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {q.length > 2 && !isFetching && isError && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}

      {q.length > 2 && !isFetching && !isError && results.length === 0 && (
        <p className="text-sm text-zinc-400">No books found for &ldquo;{q}&rdquo;.</p>
      )}

      {!isFetching && results.length > 0 && (
        <>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {results.length} book{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((book: BookSearchResult) => (
              <BookResultCard
                key={book.googleBooksId}
                book={book}
                isAdding={addBook.isPending && addBook.variables === book.googleBooksId}
                onAdd={() => addBook.mutate(book.googleBooksId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookResultCard({
  book,
  isAdding,
  onAdd,
}: {
  book: BookSearchResult;
  isAdding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {book.thumbnail ? (
        <Image
          src={book.thumbnail}
          alt={book.title}
          width={48}
          height={70}
          unoptimized
          className="h-[70px] w-12 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-[70px] w-12 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
          {book.title}
        </p>
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

        <button
          onClick={onAdd}
          disabled={isAdding}
          className="mt-3 rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-amber-900/40"
        >
          {isAdding ? "Adding…" : "+ Add to library"}
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
