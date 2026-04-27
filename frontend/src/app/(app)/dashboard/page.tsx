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

const COLUMNS: { status: ReadingStatus; label: string }[] = [
  { status: "TO_READ", label: "Want to read" },
  { status: "READ", label: "Read books" },
  { status: "READING", label: "Currently reading" },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [noteForBookId, setNoteForBookId] = useState<number | null>(null);
  const [activeBook, setActiveBook] = useState<UserBook | null>(null);

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  const updateBook = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReadingStatus }) =>
      userBooksApi.update(id, { status }),
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
      <div className="grid grid-cols-3 gap-6">
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
    </DndContext>
  );
}

// ── Column (droppable) ────────────────────────────────────────────────────────

function Column({
  status,
  label,
  children,
}: {
  status: ReadingStatus;
  label: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-40 rounded-xl p-2 transition-colors ${
        isOver ? "bg-amber-100/60" : "bg-transparent"
      }`}
    >
      {/* Column header: icon + label */}
      <div className="mb-4 flex flex-col items-center gap-1 px-1">
        <BookIcon className="h-8 w-8 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </h2>
      </div>
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
  isDragging,
}: {
  ub: UserBook;
  onMove: (s: ReadingStatus) => void;
  onRemove: () => void;
  onAddNote: () => void;
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
      className={`group relative flex gap-3 rounded-xl border bg-white p-3 transition-opacity select-none cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-40 border-zinc-300"
          : "border-zinc-200 opacity-100"
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
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-600 cursor-default">
          {ub.book.title}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {others.map((c) => (
            <button
              key={c.status}
              onClick={() => onMove(c.status)}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 cursor-pointer"
            >
              → {c.label}
            </button>
          ))}
          <button
            onClick={onAddNote}
            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 cursor-pointer"
          >
            + Note
          </button>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="absolute right-2 top-2 hidden text-zinc-300 hover:text-red-400 group-hover:block cursor-pointer"
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
    <li className="flex gap-3 rounded-xl border border-amber-300 bg-white p-3 shadow-lg rotate-1">
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
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-600">
          {ub.book.title}
        </p>
      </div>
    </li>
  );
}
