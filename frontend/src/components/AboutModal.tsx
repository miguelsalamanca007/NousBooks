"use client";

import Modal from "@/components/Modal";
import BookIcon from "@/components/BookIcon";

interface Props {
  open: boolean;
  onClose: () => void;
}

const REPO_URL = "https://github.com/miguelsalamanca007/NousBooks";

export default function AboutModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="About NousBooks" size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <BookIcon className="h-12 w-12 text-amber-500" />
        <div>
          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            NousBooks
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A small reading tracker built with Spring Boot &amp; Next.js
          </p>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-amber-700 underline hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
        >
          View on GitHub →
        </a>
      </div>
    </Modal>
  );
}
