"use client";

import Image from "next/image";
import Modal from "@/components/Modal";
import AddToLibraryButton from "@/components/AddToLibraryButton";

export interface BookDetail {
  title: string;
  authors?: string[];
  thumbnail?: string;
  publishedDate?: string;
  description?: string;
}

// Google Books thumbnails default to zoom=1 (small). zoom=0 returns a
// substantially larger cover — good enough to compare against a physical book.
function largeThumb(url: string) {
  return url.replace(/zoom=\d/, "zoom=0").replace(/&edge=curl/, "");
}

interface Props {
  book: BookDetail;
  onClose: () => void;
  /** When provided, renders an "+ Add to library" button. */
  onAdd?: () => void;
  isAdding?: boolean;
  isAdded?: boolean;
}

export default function BookDetailModal({ book, onClose, onAdd, isAdding, isAdded }: Props) {
  return (
    <Modal open title={book.title} onClose={onClose} size="lg">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Cover */}
        <div className="flex shrink-0 justify-center sm:justify-start">
          {book.thumbnail ? (
            <div className="relative h-[230px] w-[160px] shrink-0">
              <Image
                src={largeThumb(book.thumbnail)}
                alt={book.title}
                fill
                unoptimized
                className="rounded-lg object-cover shadow-md"
              />
            </div>
          ) : (
            <div className="flex h-[230px] w-[160px] items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-12 w-12"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          {book.authors && book.authors.length > 0 && (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {book.authors.join(", ")}
            </p>
          )}

          {book.publishedDate && (
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {book.publishedDate.slice(0, 4)}
            </p>
          )}

          {book.description ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {book.description}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-zinc-400 dark:text-zinc-500">
              No description available.
            </p>
          )}

          {onAdd && (
            <AddToLibraryButton
              size="md"
              isAdding={!!isAdding}
              isAdded={!!isAdded}
              onAdd={onAdd}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
