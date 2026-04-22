"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userBooksApi } from "@/lib/api";
import { ReadingStatus, UserBook } from "@/types";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  TO_READ: "Want to read",
  READING: "Reading",
  READ: "Read",
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  TO_READ: "bg-zinc-100 text-zinc-600",
  READING: "bg-blue-100 text-blue-700",
  READ: "bg-green-100 text-green-700",
};

export default function MyBooksPage() {
  const queryClient = useQueryClient();

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  const updateBook = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReadingStatus }) =>
      userBooksApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  const removeBook = useMutation({
    mutationFn: (id: number) => userBooksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My Books</h1>

      {myBooks.length === 0 && (
        <p className="text-sm text-zinc-400">
          No books yet. Search for one using the search bar.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {myBooks.map((ub: UserBook) => (
          <li
            key={ub.id}
            className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4"
          >
            {ub.book.thumbnail ? (
              <img
                src={ub.book.thumbnail}
                alt={ub.book.title}
                className="h-16 w-11 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="h-16 w-11 shrink-0 rounded bg-zinc-100" />
            )}

            <div className="min-w-0 flex-1">
              <p className="font-medium">{ub.book.title}</p>
              {ub.book.publishedDate && (
                <p className="text-xs text-zinc-400">{ub.book.publishedDate}</p>
              )}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateBook.mutate({ id: ub.id, status: s })}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                    ub.status === s
                      ? STATUS_COLORS[s]
                      : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <button
              onClick={() => removeBook.mutate(ub.id)}
              className="shrink-0 text-zinc-300 hover:text-red-400"
              title="Remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
