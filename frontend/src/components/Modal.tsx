"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Width tier — most modals are fine with the default `md`. */
  size?: "sm" | "md";
}

/**
 * Bare-bones modal shell. Click on the backdrop or press Escape to close.
 * Body scrolling is locked while the modal is open so the content behind
 * doesn't drift when the user wheels inside the modal.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = size === "sm" ? "max-w-sm" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${widthClass} rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-zinc-700 dark:text-zinc-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
