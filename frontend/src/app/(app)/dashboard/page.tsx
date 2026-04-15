"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import { BookSearchResult, ReadingStatus, UserBook } from "@/types";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "Want to read",
  READING: "Reading",
  READ: "Read",
  ABANDONED: "Abandoned",
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "bg-zinc-100 text-zinc-600",
  READING: "bg-blue-100 text-blue-700",
  READ: "bg-green-100 text-green-700",
  ABANDONED: "bg-red-100 text-red-600",
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // My reading list
  const { data: myBooks = [], isLoading: loadingList } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  // Search results
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["bookSearch", query],
    queryFn: () => booksApi.search(query),
    enabled: query.length > 2,
  });

  // Add book
  const addBook = useMutation({
    mutationFn: (googleBooksId: string) =>
      userBooksApi.add(googleBooksId, "WANT_TO_READ"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  // Update status
  const updateBook = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: ReadingStatus;
    }) => userBooksApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  // Remove book
  const removeBook = useMutation({
    mutationFn: (id: number) => userBooksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  const myGoogleIds = new Set(myBooks.map((ub) => ub.book.googleBooksId));

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput.trim());
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Search */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Find a book</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or author…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Search
          </button>
        </form>

        {searching && (
          <p className="mt-4 text-sm text-zinc-400">Searching…</p>
        )}

        {!searching && searchResults.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {searchResults.map((book: BookSearchResult) => (
              <li
                key={book.googleBooksId}
                className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4"
              >
                {book.thumbnail && (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="h-16 w-11 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <p className="font-medium leading-snug">{book.title}</p>
                  {book.authors?.length > 0 && (
                    <p className="text-sm text-zinc-500">
                      {book.authors.join(", ")}
                    </p>
                  )}
                  {book.publishedDate && (
                    <p className="text-xs text-zinc-400">{book.publishedDate}</p>
                  )}
                </div>
                <button
                  disabled={
                    myGoogleIds.has(book.googleBooksId) ||
                    addBook.isPending
                  }
                  onClick={() => addBook.mutate(book.googleBooksId)}
                  className="flex-shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {myGoogleIds.has(book.googleBooksId) ? "Added" : "+ Add"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* My reading list */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">My reading list</h2>

        {loadingList && <p className="text-sm text-zinc-400">Loading…</p>}

        {!loadingList && myBooks.length === 0 && (
          <p className="text-sm text-zinc-400">
            No books yet. Search for one above to get started.
          </p>
        )}

        {myBooks.length > 0 && (
          <ul className="flex flex-col gap-3">
            {myBooks.map((ub: UserBook) => (
              <li
                key={ub.id}
                className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4"
              >
                {ub.book.thumbnail && (
                  <img
                    src={ub.book.thumbnail}
                    alt={ub.book.title}
                    className="h-16 w-11 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-2 min-w-0">
                  <p className="font-medium leading-snug">{ub.book.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.keys(STATUS_LABELS) as ReadingStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          updateBook.mutate({ id: ub.id, status: s })
                        }
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
                </div>
                <button
                  onClick={() => removeBook.mutate(ub.id)}
                  className="flex-shrink-0 text-zinc-300 hover:text-red-500"
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
