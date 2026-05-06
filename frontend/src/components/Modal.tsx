"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // Avoid running createPortal during SSR — document doesn't exist there.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!open || !mounted) return null;

  const widthClass = size === "sm" ? "max-w-sm" : "max-w-lg";

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${widthClass} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900`}
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

  return createPortal(overlay, document.body);
}
