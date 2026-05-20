"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { notesApi } from "@/lib/api";
import { Note } from "@/types";
import NewNoteModal from "@/components/NewNoteModal";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Optional book filter coming from My Books → "Notes" button
  const bookIdParam = searchParams.get("bookId");
  const bookTitleParam = searchParams.get("bookTitle");
  const bookIdFilter = bookIdParam ? Number(bookIdParam) : null;

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["myNotes"],
    queryFn: notesApi.getMyNotes,
  });

  const filtered = useMemo(() => {
    let result = notes;

    // Apply book filter if coming from My Books
    if (bookIdFilter) {
      result = result.filter((n) => n.bookId === bookIdFilter);
    }

    // Apply text search on top
    const q = search.toLowerCase();
    if (!q) return result;
    return result.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.bookTitle?.toLowerCase().includes(q)
    );
  }, [notes, search, bookIdFilter]);

  function clearBookFilter() {
    router.push("/notes");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My Notes</h1>

          {/* Active book filter badge */}
          {bookIdFilter && bookTitleParam && (
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-200 to-orange-200 px-3 py-0.5 text-xs font-semibold text-amber-900 shadow-sm shadow-amber-300/40 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-100">
              {bookTitleParam}
              <button
                onClick={clearBookFilter}
                className="hover:text-amber-700 dark:hover:text-amber-300"
                title="Clear filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        <button
          onClick={() => setCreating(true)}
          className="nb-btn-accent shrink-0 rounded-full px-4 py-2 text-sm font-semibold tracking-tight"
        >
          + New note
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search in your notes..."
        className="nb-input mb-6 max-w-sm !rounded-full"
      />

      {isLoading && <p className="text-sm text-zinc-400">Loading…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-zinc-400">
          {bookIdFilter
            ? "No notes for this book yet."
            : search
            ? "No notes match your search."
            : "No notes yet."}
        </p>
      )}

      <NewNoteModal
        open={creating}
        onClose={() => setCreating(false)}
        defaultBookId={bookIdFilter ?? undefined}
      />

      {filtered.length > 0 && (
        <>
          {/* Mobile: card list */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {filtered.map((note: Note) => (
              <li
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="nb-card cursor-pointer rounded-2xl p-4"
              >
                <p className="font-medium text-zinc-800 leading-snug dark:text-zinc-100">
                  {note.title || (
                    <span className="italic text-zinc-400">Untitled</span>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                  {note.bookTitle && (
                    <>
                      <span className="truncate max-w-[140px] text-zinc-500 dark:text-zinc-400">
                        {note.bookTitle}
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="nb-surface hidden overflow-hidden rounded-2xl sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((note: Note) => (
                  <tr
                    key={note.id}
                    onClick={() => router.push(`/notes/${note.id}`)}
                    className="group cursor-pointer border-b border-zinc-100/80 transition-colors hover:bg-amber-50/50 dark:border-zinc-800/60 dark:hover:bg-amber-950/20"
                  >
                    <td className="px-5 py-3 font-medium text-zinc-800 group-hover:text-amber-800 dark:text-zinc-100 dark:group-hover:text-amber-200">
                      {note.title || (
                        <span className="text-zinc-400 italic">Untitled</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                      {note.bookTitle || "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{formatDate(note.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
