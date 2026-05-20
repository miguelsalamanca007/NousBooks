"use client";

import { useEffect, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi, userBooksApi } from "@/lib/api";
import { UserBook } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select a specific book (e.g. when opened from a BookCard). */
  defaultBookId?: number;
}

export default function NewNoteModal({ open, onClose, defaultBookId }: Props) {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [bookId, setBookId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load the user's library so we can pick which book the note is about.
  // Only fetch while the modal is actually open.
  const { data: myBooks = [] } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
    enabled: open,
  });

  // Reset form whenever the modal is opened/closed or the default changes.
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setBookId(defaultBookId ?? "");
        setTitle("");
        setContent("");
        setError(null);
      });
    }
  }, [open, defaultBookId]);

  // Close on Escape so it feels like a real modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const createNote = useMutation({
    mutationFn: () =>
      notesApi.create(Number(bookId), content.trim(), title.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
      onClose();
    },
    onError: () => setError("Could not save the note. Try again."),
  });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bookId) return setError("Pick a book first.");
    if (content.trim().length === 0) return setError("Content can't be empty.");
    createNote.mutate();
  }

  return (
    <div
      className="nb-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      {/* Stop propagation so clicking inside the card doesn't close the modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-note-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="nb-modal-in w-full max-w-lg rounded-2xl border border-white/60 bg-white/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
      >
        <h2 id="new-note-modal-title" className="mb-5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">New note</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Book selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Book</label>
            <select
              value={bookId}
              onChange={(e) =>
                setBookId(e.target.value ? Number(e.target.value) : "")
              }
              className="nb-input"
            >
              <option value="">Select a book…</option>
              {myBooks.map((ub: UserBook) => (
                <option key={ub.id} value={ub.book.id}>
                  {ub.book.title}
                </option>
              ))}
            </select>
            {myBooks.length === 0 && (
              <p className="text-xs text-zinc-400">
                Your library is empty. Add a book from the search bar first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Title <span className="normal-case text-zinc-400">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="nb-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="nb-input leading-relaxed"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNote.isPending}
              className="nb-btn-primary rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {createNote.isPending ? "Saving…" : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
