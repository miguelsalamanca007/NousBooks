"use client";

import { useState } from "react";
import Image from "next/image";
import BookIcon from "@/components/BookIcon";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userBooksApi } from "@/lib/api";
import { ReadingStatus, UserBook } from "@/types";
import NewNoteModal from "@/components/NewNoteModal";
import StarRating from "@/components/StarRating";
import ProgressBar from "@/components/ProgressBar";
import UpdateProgressModal from "@/components/UpdateProgressModal";
import BookDetailModal from "@/components/BookDetailModal";

const COLUMNS: { status: ReadingStatus; label: string }[] = [
  { status: "TO_READ", label: "Want to read" },
  { status: "READING", label: "Currently reading" },
  { status: "READ", label: "Read books" },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [noteForBookId, setNoteForBookId] = useState<number | null>(null);
  const [progressForId, setProgressForId] = useState<number | null>(null);
  const [activeBook, setActiveBook] = useState<UserBook | null>(null);
  const [mobileTab, setMobileTab] = useState<ReadingStatus>("TO_READ");
  const [detailBook, setDetailBook] = useState<UserBook["book"] | null>(null);

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  const updateBook = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReadingStatus }) =>
      userBooksApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  const rateBook = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number | null }) =>
      userBooksApi.update(id, { rating: rating ?? undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  const removeBook = useMutation({
    mutationFn: (id: number) => userBooksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBooks"] }),
  });

  // Require the user to drag at least 8px before activating — prevents
  // accidental drags when clicking buttons inside the card.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const book = myBooks.find((ub) => ub.id === event.active.id);
    if (book) setActiveBook(book);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBook(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ReadingStatus;
    const book = myBooks.find((ub) => ub.id === active.id);
    if (!book || book.status === newStatus) return;

    updateBook.mutate({ id: book.id, status: newStatus });
  }

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ── Mobile tab bar ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex rounded-xl border border-zinc-200 bg-white p-1 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        {COLUMNS.map(({ status, label }) => {
          const count = myBooks.filter((ub) => ub.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setMobileTab(status)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                mobileTab === status
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1 text-zinc-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Mobile: single active column ───────────────────────────────────── */}
      <div className="md:hidden">
        {COLUMNS.filter((c) => c.status === mobileTab).map(({ status, label }) => {
          const books = myBooks.filter((ub) => ub.status === status);
          return (
            <Column key={status} status={status} label={label} hiddenHeader>
              {books.length === 0 && (
                <p className="py-8 text-center text-sm text-zinc-400">
                  No books here yet.
                </p>
              )}
              {books.map((ub) => (
                <BookCard
                  key={ub.id}
                  ub={ub}
                  onMove={(newStatus) => {
                    updateBook.mutate({ id: ub.id, status: newStatus });
                    setMobileTab(newStatus);
                  }}
                  onRemove={() => removeBook.mutate(ub.id)}
                  onAddNote={() => setNoteForBookId(ub.book.id)}
                  onRate={(rating) => rateBook.mutate({ id: ub.id, rating })}
                  onUpdateProgress={() => setProgressForId(ub.id)}
                  onOpenDetail={() => setDetailBook(ub.book)}
                  isDragging={false}
                />
              ))}
            </Column>
          );
        })}
      </div>

      {/* ── Desktop: 3-column grid (drag & drop) ───────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-6">
        {COLUMNS.map(({ status, label }) => {
          const books = myBooks.filter((ub) => ub.status === status);
          return (
            <Column key={status} status={status} label={label}>
              {books.map((ub) => (
                <BookCard
                  key={ub.id}
                  ub={ub}
                  onMove={(newStatus) =>
                    updateBook.mutate({ id: ub.id, status: newStatus })
                  }
                  onRemove={() => removeBook.mutate(ub.id)}
                  onAddNote={() => setNoteForBookId(ub.book.id)}
                  onRate={(rating) => rateBook.mutate({ id: ub.id, rating })}
                  onUpdateProgress={() => setProgressForId(ub.id)}
                  onOpenDetail={() => setDetailBook(ub.book)}
                  isDragging={activeBook?.id === ub.id}
                />
              ))}
            </Column>
          );
        })}
      </div>

      {/* Ghost card that follows the cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeBook && <BookCardStatic ub={activeBook} />}
      </DragOverlay>

      <NewNoteModal
        open={noteForBookId !== null}
        onClose={() => setNoteForBookId(null)}
        defaultBookId={noteForBookId ?? undefined}
      />

      <UpdateProgressModal
        open={progressForId !== null}
        onClose={() => setProgressForId(null)}
        userBook={myBooks.find((ub) => ub.id === progressForId) ?? null}
      />

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
        />
      )}
    </DndContext>
  );
}

// ── Column (droppable) ────────────────────────────────────────────────────────

function Column({
  status,
  label,
  children,
  hiddenHeader = false,
}: {
  status: ReadingStatus;
  label: string;
  children: React.ReactNode;
  hiddenHeader?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-40 rounded-xl p-2 transition-colors ${
        isOver ? "bg-amber-100/60 dark:bg-amber-900/20" : "bg-transparent"
      }`}
    >
      {/* Column header — hidden when tabs already show the label */}
      {!hiddenHeader && (
        <div className="mb-4 flex flex-col items-center gap-1 px-1">
          <BookIcon className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </h2>
        </div>
      )}
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

// ── BookCard (draggable) ──────────────────────────────────────────────────────

function BookCard({
  ub,
  onMove,
  onRemove,
  onAddNote,
  onRate,
  onUpdateProgress,
  onOpenDetail,
  isDragging,
}: {
  ub: UserBook;
  onMove: (s: ReadingStatus) => void;
  onRemove: () => void;
  onAddNote: () => void;
  onRate: (rating: number | null) => void;
  onUpdateProgress: () => void;
  onOpenDetail: () => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ub.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const others = COLUMNS.filter((c) => c.status !== ub.status);

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex gap-3 rounded-xl border bg-white p-3 transition-opacity select-none cursor-grab active:cursor-grabbing dark:bg-zinc-900 ${
        isDragging
          ? "opacity-40 border-zinc-300 dark:border-zinc-700"
          : "border-zinc-200 opacity-100 dark:border-zinc-800"
      }`}
    >
      {ub.book.thumbnail ? (
        <Image
          src={ub.book.thumbnail}
          alt={ub.book.title}
          width={44}
          height={64}
          unoptimized
          className="h-16 w-11 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-16 w-11 shrink-0 rounded bg-zinc-100" />
      )}

      <div className="min-w-0 flex-1">
        <button
          onClick={onOpenDetail}
          onPointerDown={(e) => e.stopPropagation()}
          className="line-clamp-2 text-left text-sm font-medium leading-snug text-zinc-700 hover:text-amber-700 hover:underline dark:text-zinc-200 dark:hover:text-amber-400"
        >
          {ub.book.title}
        </button>

        {/* Star rating — stop drag events so clicking stars doesn't drag */}
        <div
          className="mt-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <StarRating value={ub.rating} onChange={onRate} size="sm" />
        </div>

        {/* Reading progress — only relevant while the book is being read.
            Compact bar; the full readout lives in the Update progress modal. */}
        {ub.status === "READING" && (
          <div
            className="mt-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ProgressBar
              current={ub.currentPage}
              total={ub.book.pageCount}
              compact
            />
            <button
              onClick={onUpdateProgress}
              className="mt-1 text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {ub.currentPage != null && ub.book.pageCount
                ? `${ub.currentPage} / ${ub.book.pageCount} pages`
                : "Update progress"}
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {others.map((c) => (
            <button
              key={c.status}
              onClick={() => onMove(c.status)}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 cursor-pointer dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              → {c.label}
            </button>
          ))}
          <button
            onClick={onAddNote}
            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 cursor-pointer dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60"
          >
            + Note
          </button>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="absolute right-2 top-2 hidden text-zinc-300 hover:text-red-400 group-hover:block cursor-pointer dark:text-zinc-600 dark:hover:text-red-400"
        title="Remove"
      >
        ✕
      </button>
    </li>
  );
}

// ── BookCardStatic — ghost shown in DragOverlay ───────────────────────────────

function BookCardStatic({ ub }: { ub: UserBook }) {
  return (
    <li className="flex gap-3 rounded-xl border border-amber-300 bg-white p-3 shadow-lg rotate-1 dark:border-amber-700 dark:bg-zinc-900">
      {ub.book.thumbnail ? (
        <Image
          src={ub.book.thumbnail}
          alt={ub.book.title}
          width={44}
          height={64}
          unoptimized
          className="h-16 w-11 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-16 w-11 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-200">
          {ub.book.title}
        </p>
      </div>
    </li>
  );
}
