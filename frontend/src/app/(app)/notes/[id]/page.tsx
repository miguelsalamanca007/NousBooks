"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";

export default function NoteDetailPage() {
  const [, startTransition] = useTransition();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.getById(Number(id)),
    enabled: !!id,
  });

  // Initialize local state when the note loads for the first time (or when we
  // navigate to a different note). We key on `note.id` so a background refetch
  // after auto-save doesn't clobber what the user is currently typing.
  useEffect(() => {
    if (!note) return;
    startTransition(() => {
      setTitle(note.title ?? "");
      setContent(note.content);
    });
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the textarea height in sync with the content — grows as you type.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [content]);

  const updateNote = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      notesApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: () => notesApi.remove(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
      router.push("/notes");
    },
  });

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!note) return <p className="text-sm text-zinc-400">Note not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">

      {/* Back + Delete */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/notes")}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          {updateNote.isPending && (
            <span className="text-xs text-zinc-400">Saving…</span>
          )}
          <button
            onClick={() => {
              if (confirm("Delete this note?")) deleteNote.mutate();
            }}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Title — always editable, auto-save on blur */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (title !== (note.title ?? "")) {
            updateNote.mutate({ title: title.trim() || undefined });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            contentRef.current?.focus();
          }
        }}
        placeholder="Untitled"
        className="mb-2 w-full bg-transparent text-3xl font-semibold text-zinc-800 outline-none placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-600"
      />

      {/* Metadata */}
      <p className="mb-8 text-sm text-zinc-400">
        {note.bookTitle && <span>{note.bookTitle} · </span>}
        {new Date(note.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Content — auto-grows, auto-save on blur */}
      <textarea
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => {
          if (content !== note.content) {
            updateNote.mutate({ content });
          }
        }}
        placeholder="Write something…"
        rows={1}
        className="w-full resize-none bg-transparent text-base leading-relaxed text-zinc-700 outline-none placeholder:text-zinc-300 dark:text-zinc-200 dark:placeholder:text-zinc-600"
      />

    </div>
  );
}
