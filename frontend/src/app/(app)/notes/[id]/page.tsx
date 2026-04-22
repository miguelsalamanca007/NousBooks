"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.getById(Number(id)),
    enabled: !!id,
  });

  const updateNote = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      notesApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
      setEditing(false);
    },
  });

  const deleteNote = useMutation({
    mutationFn: () => notesApi.remove(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
      router.push("/notes");
    },
  });

  function startEditing() {
    if (!note) return;
    setEditTitle(note.title ?? "");
    setEditContent(note.content);
    setEditing(true);
  }

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!note) return <p className="text-sm text-zinc-400">Note not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700"
      >
        ← Back
      </button>

      {editing ? (
        <div className="flex flex-col gap-4">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xl font-semibold outline-none focus:border-zinc-500"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateNote.mutate({ title: editTitle, content: editContent })
              }
              disabled={updateNote.isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {updateNote.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-1 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold leading-tight">
              {note.title || <span className="text-zinc-300">Untitled</span>}
            </h1>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={startEditing}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this note?")) deleteNote.mutate();
                }}
                className="rounded-lg border border-red-100 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Book + date */}
          <p className="mb-6 text-sm text-zinc-400">
            {note.bookTitle && <span>{note.bookTitle} · </span>}
            {new Date(note.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Content */}
          <blockquote className="border-l-2 border-zinc-200 pl-5 text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </blockquote>
        </>
      )}
    </div>
  );
}
