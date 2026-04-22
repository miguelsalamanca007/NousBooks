"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notesApi } from "@/lib/api";
import { Note } from "@/types";

export default function NotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["myNotes"],
    queryFn: notesApi.getMyNotes,
  });

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.bookTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="mb-5 text-2xl font-semibold">My Notes</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search in your notes..."
        className="mb-6 w-full max-w-sm rounded-full border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-zinc-400"
      />

      {isLoading && <p className="text-sm text-zinc-400">Loading…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-zinc-400">
          {search ? "No notes match your search." : "No notes yet."}
        </p>
      )}

      {filtered.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="pb-3 pr-6">Title</th>
              <th className="pb-3 pr-6">Book</th>
              <th className="pb-3">Date Creation</th>
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
