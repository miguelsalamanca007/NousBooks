"use client";

import { useEffect, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { highlightsApi, userBooksApi } from "@/lib/api";
import { UserBook } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select a book (e.g. when opened from the book detail modal). */
  defaultBookId?: number;
}

export default function HighlightCaptureModal({
  open,
  onClose,
  defaultBookId,
}: Props) {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [bookId, setBookId] = useState<number | "">("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: myBooks = [] } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setBookId(defaultBookId ?? "");
        setText("");
        setNote("");
        setPageNumber("");
        setError(null);
      });
    }
  }, [open, defaultBookId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const create = useMutation({
    mutationFn: () =>
      highlightsApi.create({
        bookId: Number(bookId),
        text: text.trim(),
        note: note.trim() || undefined,
        pageNumber: pageNumber ? Number(pageNumber) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myHighlights"] });
      queryClient.invalidateQueries({
        queryKey: ["highlightsByBook", Number(bookId)],
      });
      onClose();
    },
    onError: () => setError("Could not save the highlight. Try again."),
  });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bookId) return setError("Pick a book first.");
    if (text.trim().length === 0) return setError("Highlight text can't be empty.");
    if (text.length > 5000) return setError("Highlight is too long (max 5000 chars).");
    create.mutate();
  }

  return (
    <div
      className="nb-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="highlight-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="nb-modal-in w-full max-w-xl rounded-2xl border border-white/60 bg-white/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
      >
        <h2
          id="highlight-modal-title"
          className="mb-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          New highlight
        </h2>
        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
          Capture a quote or passage from the book. We&apos;ll make it
          searchable by meaning, not just keywords.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Book
            </label>
            <select
              value={bookId}
              onChange={(e) =>
                setBookId(e.target.value ? Number(e.target.value) : "")
              }
              className="nb-input"
              disabled={defaultBookId !== undefined}
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
                Your library is empty. Add a book from search first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Highlighted text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={5000}
              required
              placeholder="Paste the passage you want to remember…"
              className="nb-input leading-relaxed"
            />
            <p className="text-right text-xs text-zinc-400">
              {text.length} / 5000
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Your note{" "}
              <span className="normal-case text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Why does this matter to you?"
              className="nb-input leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Page{" "}
              <span className="normal-case text-zinc-400">(optional)</span>
            </label>
            <input
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              className="nb-input w-32"
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
              disabled={create.isPending}
              className="nb-btn-primary rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save highlight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
