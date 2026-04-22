"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userBooksApi } from "@/lib/api";
import { ReadingStatus, UserBook } from "@/types";

const COLUMNS: { status: ReadingStatus; label: string }[] = [
  { status: "READING", label: "Currently reading" },
  { status: "WANT_TO_READ", label: "Want to read" },
  { status: "READ", label: "Read books" },
];

export default function DashboardPage() {
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

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {COLUMNS.map(({ status, label }) => {
        const books = myBooks.filter((ub) => ub.status === status);
        return (
          <div key={status}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              {label}
            </h2>

            {books.length === 0 && (
              <p className="text-sm text-zinc-300">No books here yet</p>
            )}

            <ul className="flex flex-col gap-3">
              {books.map((ub: UserBook) => (
                <BookCard
                  key={ub.id}
                  ub={ub}
                  onMove={(newStatus) =>
                    updateBook.mutate({ id: ub.id, status: newStatus })
                  }
                  onRemove={() => removeBook.mutate(ub.id)}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function BookCard({
  ub,
  onMove,
  onRemove,
}: {
  ub: UserBook;
  onMove: (s: ReadingStatus) => void;
  onRemove: () => void;
}) {
  const others = COLUMNS.filter((c) => c.status !== ub.status);

  return (
    <li className="group relative flex gap-3 rounded-xl border border-zinc-200 bg-white p-3">
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
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {ub.book.title}
        </p>

        {/* Move to other column */}
        <div className="mt-2 flex flex-wrap gap-1">
          {others.map((c) => (
            <button
              key={c.status}
              onClick={() => onMove(c.status)}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200"
            >
              → {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 hidden text-zinc-300 hover:text-red-400 group-hover:block"
        title="Remove"
      >
        ✕
      </button>
    </li>
  );
}
