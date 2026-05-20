"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Width tier — most modals are fine with the default `md`. */
  size?: "sm" | "md" | "lg";
}

/**
 * Bare-bones modal shell. Click on the backdrop or press Escape to close.
 * Body scrolling is locked while the modal is open so the content behind
 * doesn't drift when the user wheels inside the modal.
 *
 * Renders into a portal at document.body. This is critical because any
 * ancestor with `transform`, `filter`, or `backdrop-filter` (the navbar uses
 * `backdrop-blur`) creates a new containing block for `position: fixed`,
 * which otherwise traps the modal inside that element.
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

  // `open` is always toggled from a client event (button click), so this
  // component never renders with `open === true` during SSR — no need for a
  // separate "mounted" guard around createPortal.
  if (!open || typeof document === "undefined") return null;

  const widthClass = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  const overlay = (
    <div
      className="nb-backdrop-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/55 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`nb-modal-in w-full ${widthClass} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="modal-title"
            className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
