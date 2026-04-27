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

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-800">My Notes</h1>

          {/* Active book filter badge */}
          {bookIdFilter && bookTitleParam && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
              {bookTitleParam}
              <button
                onClick={clearBookFilter}
                className="hover:text-amber-600"
                title="Clear filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        <button
          onClick={() => setCreating(true)}
          className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + New note
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search in your notes..."
        className="mb-6 w-full max-w-sm rounded-full border border-zinc-400 px-4 py-2 text-sm text-zinc-500 outline-none focus:border-zinc-500"
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="pb-3 pr-6">Title</th>
              <th className="pb-3 pr-6">Book</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((note: Note) => (
              <tr
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
              >
                <td className="py-3 pr-6 font-medium text-zinc-800">
                  {note.title || <span className="text-zinc-400 italic">Untitled</span>}
                </td>
                <td className="py-3 pr-6 text-zinc-500">
                  {note.bookTitle || "—"}
                </td>
                <td className="py-3 text-zinc-400">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
