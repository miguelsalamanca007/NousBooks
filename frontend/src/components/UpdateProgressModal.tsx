"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal";
import ProgressBar from "@/components/ProgressBar";
import { userBooksApi } from "@/lib/api";
import { UserBook } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The user-book whose progress we're editing. Pass null to render nothing. */
  userBook: UserBook | null;
}

/**
 * Update reading progress for a single book. Lets the user set the current
 * page, and — when Google Books didn't provide one — also fill in the total
 * page count. The backend takes care of clamping and auto-promoting the
 * status to READ when the user reaches the end.
 *
 * Inner Form pattern (same as EditProfile/ChangePassword): the modal mounts
 * Form once it has a userBook, and Form seeds its state from props via
 * useState initializers. This avoids the react-hooks/set-state-in-effect
 * lint rule and gives clean state on every open.
 */
export default function UpdateProgressModal({ open, onClose, userBook }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Update progress" size="sm">
      {userBook ? (
        <Form userBook={userBook} onClose={onClose} />
      ) : (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}
    </Modal>
  );
}

function Form({ userBook, onClose }: { userBook: UserBook; onClose: () => void }) {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState<string>(
    userBook.currentPage != null ? String(userBook.currentPage) : ""
  );
  const [pageCount, setPageCount] = useState<string>(
    userBook.book.pageCount != null ? String(userBook.book.pageCount) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const knownTotal = userBook.book.pageCount;
  const needsPageCount = knownTotal == null;

  const update = useMutation({
    mutationFn: (data: { currentPage?: number; pageCount?: number }) =>
      userBooksApi.update(userBook.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
    onError: () => setError("Could not save progress. Try again."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cp = currentPage === "" ? null : Number(currentPage);
    const pc = pageCount === "" ? null : Number(pageCount);

    if (cp == null || Number.isNaN(cp) || cp < 0) {
      setError("Enter a valid page number.");
      return;
    }
    if (needsPageCount) {
      if (pc == null || Number.isNaN(pc) || pc < 1) {
        setError("Enter the book's total page count.");
        return;
      }
      if (cp > pc) {
        setError("Current page can't be more than the total.");
        return;
      }
    } else if (cp > knownTotal!) {
      setError(`This book only has ${knownTotal} pages.`);
      return;
    }

    const data: { currentPage: number; pageCount?: number } = { currentPage: cp };
    if (needsPageCount) data.pageCount = pc!;
    update.mutate(data);
  }

  // Live preview — recompute against whatever the user has typed in (so the
  // bar reacts as they edit). Falls back to the persisted total when the
  // book already has one.
  const previewTotal = needsPageCount
    ? pageCount === "" ? null : Number(pageCount)
    : knownTotal;
  const previewCurrent = currentPage === "" ? 0 : Number(currentPage);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">
          {userBook.book.title}
        </span>
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Current page
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
          autoFocus
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {needsPageCount && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total pages
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <p className="text-xs text-zinc-400">
            Google Books didn&apos;t supply this — fill it in once and we&apos;ll
            remember it.
          </p>
        </div>
      )}

      {/* Live preview of where the bar will end up after save. */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
        <ProgressBar current={previewCurrent} total={previewTotal} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={update.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
