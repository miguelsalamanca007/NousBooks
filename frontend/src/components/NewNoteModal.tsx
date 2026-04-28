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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={onClose}
    >
      {/* Stop propagation so clicking inside the card doesn't close the modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-note-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="new-note-modal-title" className="mb-4 text-xl font-semibold text-zinc-600">New note</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Book selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Book</label>
            <select
              value={bookId}
              onChange={(e) =>
                setBookId(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-500"
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Title <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-zinc-500 text-zinc-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNote.isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {createNote.isPending ? "Saving…" : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
