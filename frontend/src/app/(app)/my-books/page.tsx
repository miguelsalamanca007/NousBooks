"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userBooksApi } from "@/lib/api";
import { Book, STATUS_COLORS, STATUS_LABELS } from "@/types";
import BookIcon from "@/components/BookIcon";
import StarRating from "@/components/StarRating";
import ProgressBar from "@/components/ProgressBar";
import UpdateProgressModal from "@/components/UpdateProgressModal";
import BookDetailModal from "@/components/BookDetailModal";
import HighlightCaptureModal from "@/components/HighlightCaptureModal";

export default function MyBooksPage() {
  const queryClient = useQueryClient();
  const [progressForId, setProgressForId] = useState<number | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [highlightForBookId, setHighlightForBookId] = useState<number | null>(null);

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  const removeBook = useMutation({
    mutationFn: (id: number) => userBooksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  const rateBook = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number | null }) =>
      userBooksApi.update(id, { rating: rating ?? undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="nb-skeleton h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My Books</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{myBooks.length} book{myBooks.length !== 1 ? "s" : ""} in your library</p>
      </div>

      {myBooks.length === 0 && (
        <div className="nb-surface rounded-2xl p-10 text-center">
          <BookIcon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No books yet. Search for one using the search bar above.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {myBooks.map((ub) => (
          <li
            key={ub.id}
            className="nb-card flex items-start gap-3 rounded-2xl p-3 sm:items-center sm:gap-4 sm:p-4"
          >
            {/* Cover */}
            {ub.book.thumbnail ? (
              <Image
                src={ub.book.thumbnail}
                alt={ub.book.title}
                width={44}
                height={64}
                unoptimized
                className="h-16 w-11 shrink-0 rounded-md object-cover shadow-md shadow-zinc-900/15 ring-1 ring-black/5"
              />
            ) : (
              <div className="h-16 w-11 shrink-0 rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700" />
            )}

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setDetailBook(ub.book)}
                className="text-left font-medium leading-snug text-zinc-700 hover:text-amber-700 hover:underline dark:text-zinc-200 dark:hover:text-amber-400"
              >
                {ub.book.title}
              </button>
              {ub.book.publishedDate && (
                <p className="text-xs text-zinc-400">{ub.book.publishedDate}</p>
              )}

              {/* Reading progress, when relevant. Same row layout on both
                  breakpoints — the bar takes whatever width is left. */}
              {ub.status === "READING" && (
                <button
                  onClick={() => setProgressForId(ub.id)}
                  className="mt-2 block w-full max-w-xs text-left"
                >
                  <ProgressBar
                    current={ub.currentPage}
                    total={ub.book.pageCount}
                  />
                </button>
              )}

              {/* On mobile, actions live below the title */}
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                <StarRating
                  value={ub.rating}
                  onChange={(rating) => rateBook.mutate({ id: ub.id, rating })}
                  size="sm"
                />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[ub.status]}`}
                >
                  {STATUS_LABELS[ub.status]}
                </span>
                <Link
                  href={`/notes?bookId=${ub.book.id}&bookTitle=${encodeURIComponent(ub.book.title)}`}
                  className="rounded-full border border-zinc-200/80 bg-white/60 px-2.5 py-0.5 text-xs text-zinc-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:border-zinc-700/80 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-200"
                >
                  Notes
                </Link>
              </div>
            </div>

            {/* Desktop-only: rating + status pill + notes + remove in a row */}
            <div className="hidden sm:block">
              <StarRating
                value={ub.rating}
                onChange={(rating) => rateBook.mutate({ id: ub.id, rating })}
                size="sm"
              />
            </div>

            <span
              className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ub.status]}`}
            >
              {STATUS_LABELS[ub.status]}
            </span>

            <Link
              href={`/notes?bookId=${ub.book.id}&bookTitle=${encodeURIComponent(ub.book.title)}`}
              className="hidden sm:inline-flex shrink-0 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Notes
            </Link>

            <button
              onClick={() => removeBook.mutate(ub.id)}
              aria-label={`Remove ${ub.book.title}`}
              className="shrink-0 self-start text-zinc-300 hover:text-red-400 sm:self-auto dark:text-zinc-600 dark:hover:text-red-400"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <UpdateProgressModal
        open={progressForId !== null}
        onClose={() => setProgressForId(null)}
        userBook={myBooks.find((ub) => ub.id === progressForId) ?? null}
      />

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onAddHighlight={() => {
            setHighlightForBookId(detailBook.id);
            setDetailBook(null);
          }}
        />
      )}

      <HighlightCaptureModal
        open={highlightForBookId !== null}
        onClose={() => setHighlightForBookId(null)}
        defaultBookId={highlightForBookId ?? undefined}
      />
    </div>
  );
}
