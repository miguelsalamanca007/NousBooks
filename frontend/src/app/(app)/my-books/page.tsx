"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userBooksApi } from "@/lib/api";
import { STATUS_COLORS, STATUS_LABELS } from "@/types";
import StarRating from "@/components/StarRating";

export default function MyBooksPage() {
  const queryClient = useQueryClient();

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

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-800">My Books</h1>

      {myBooks.length === 0 && (
        <p className="text-sm text-zinc-400">
          No books yet. Search for one using the search bar.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {myBooks.map((ub) => (
          <li
            key={ub.id}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:items-center sm:gap-4 sm:p-4"
          >
            {/* Cover */}
            {ub.book.thumbnail ? (
              <Image
                src={ub.book.thumbnail}
                alt={ub.book.title}
                width={44}
                height={64}
                unoptimized
                className="h-16 w-11 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-11 shrink-0 rounded bg-zinc-100" />
            )}

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-700 leading-snug">
                {ub.book.title}
              </p>
              {ub.book.publishedDate && (
                <p className="text-xs text-zinc-400">{ub.book.publishedDate}</p>
              )}

              {/* On mobile, actions live below the title */}
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                <StarRating
                  value={ub.rating}
                  onChange={(rating) => rateBook.mutate({ id: ub.id, rating })}
                  size="sm"
                />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ub.status]}`}
                >
                  {STATUS_LABELS[ub.status]}
                </span>
                <Link
                  href={`/notes?bookId=${ub.book.id}&bookTitle=${encodeURIComponent(ub.book.title)}`}
                  className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
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
              className="hidden sm:inline-flex shrink-0 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            >
              Notes
            </Link>

            <button
              onClick={() => removeBook.mutate(ub.id)}
              aria-label={`Remove ${ub.book.title}`}
              className="shrink-0 self-start text-zinc-300 hover:text-red-400 sm:self-auto"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
