"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statsApi, userApi, userBooksApi } from "@/lib/api";
import { Book, UserBook } from "@/types";
import BookIcon from "@/components/BookIcon";
import ProgressBar from "@/components/ProgressBar";
import UpdateProgressModal from "@/components/UpdateProgressModal";
import BookDetailModal from "@/components/BookDetailModal";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progressForId, setProgressForId] = useState<number | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: userApi.getMe,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.getMyStats,
  });

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["myBooks"],
    queryFn: userBooksApi.getMyBooks,
  });

  const startReading = useMutation({
    mutationFn: (id: number) => userBooksApi.update(id, { status: "READING" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: (id: number) => userBooksApi.update(id, { status: "READ" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const currentlyReading = myBooks.filter((ub) => ub.status === "READING");
  const upNext = myBooks.filter((ub) => ub.status === "TO_READ").slice(0, 4);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (q.length > 0) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  const firstName = (me?.name ?? me?.email?.split("@")[0] ?? "").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="nb-skeleton h-12 w-2/3" />
        <div className="nb-skeleton h-14 w-full" />
        <div className="nb-skeleton h-64 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <div className="nb-skeleton h-24" />
          <div className="nb-skeleton h-24" />
          <div className="nb-skeleton h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {greeting}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {headlineFor(stats?.readThisYear, currentlyReading.length)}
        </p>
      </header>

      {/* ── Quick add ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search and add a book…"
          className="nb-input w-full !pl-11 !pr-28 !py-3 text-sm"
        />
        <button
          type="submit"
          disabled={searchQ.trim().length === 0}
          className="nb-btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-4 py-1.5 text-xs font-semibold tracking-tight disabled:opacity-40"
        >
          Search
        </button>
      </form>

      {/* ── Currently reading hero ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="nb-eyebrow">Currently reading</h2>
          {currentlyReading.length > 1 && (
            <span className="text-xs text-zinc-400">
              {currentlyReading.length} books
            </span>
          )}
        </div>

        {currentlyReading.length === 0 ? (
          <EmptyReadingState
            hasBooks={myBooks.length > 0}
            upNext={upNext}
            onStart={(id) => startReading.mutate(id)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentlyReading.map((ub) => (
              <ReadingHeroCard
                key={ub.id}
                ub={ub}
                onLog={() => setProgressForId(ub.id)}
                onFinish={() => markAsRead.mutate(ub.id)}
                onOpen={() => setDetailBook(ub.book)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {stats && (
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <MiniStat
            label="Read this year"
            value={stats.readThisYear}
            accent="emerald"
          />
          <MiniStat
            label="In library"
            value={stats.totalBooks}
            accent="amber"
          />
          <MiniStat
            label="Notes"
            value={stats.totalNotes}
            accent="sky"
          />
        </section>
      )}

      {/* ── Up next ──────────────────────────────────────────────────────── */}
      {upNext.length > 0 && currentlyReading.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="nb-eyebrow">Up next</h2>
            <Link
              href="/my-books"
              className="text-xs font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {upNext.map((ub) => (
              <UpNextCard
                key={ub.id}
                ub={ub}
                onStart={() => startReading.mutate(ub.id)}
                onOpen={() => setDetailBook(ub.book)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
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
    </div>
  );
}

// ─── Currently-reading hero card ──────────────────────────────────────────────

function ReadingHeroCard({
  ub,
  onLog,
  onFinish,
  onOpen,
}: {
  ub: UserBook;
  onLog: () => void;
  onFinish: () => void;
  onOpen: () => void;
}) {
  const pct =
    ub.currentPage != null && ub.book.pageCount
      ? Math.min(100, Math.round((ub.currentPage / ub.book.pageCount) * 100))
      : null;

  return (
    <article className="nb-card group relative flex gap-5 overflow-hidden rounded-2xl p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-sky-300/20 to-cyan-400/10 blur-3xl" />

      {ub.book.thumbnail ? (
        <Image
          src={ub.book.thumbnail}
          alt={ub.book.title}
          width={96}
          height={140}
          unoptimized
          className="h-[140px] w-24 shrink-0 rounded-lg object-cover shadow-xl shadow-zinc-900/25 ring-1 ring-black/10"
        />
      ) : (
        <div className="h-[140px] w-24 shrink-0 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700" />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          onClick={onOpen}
          className="line-clamp-2 text-left text-base font-semibold leading-snug text-zinc-800 hover:text-amber-700 hover:underline dark:text-zinc-100 dark:hover:text-amber-400"
        >
          {ub.book.title}
        </button>

        {ub.book.authors && ub.book.authors.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {ub.book.authors.join(", ")}
          </p>
        )}
        {ub.book.publisher && (
          <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
            {ub.book.publisher}
          </p>
        )}
        {ub.book.publishedDate && (
          <p className="mt-0.5 text-xs text-zinc-400">{ub.book.publishedDate}</p>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          <ProgressBar
            current={ub.currentPage}
            total={ub.book.pageCount}
          />
          <div className="flex items-baseline justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {ub.currentPage != null && ub.book.pageCount
                ? `${ub.currentPage} / ${ub.book.pageCount} pages`
                : "No progress yet"}
            </span>
            {pct != null && (
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {pct}%
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <button
            onClick={onLog}
            className="nb-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight"
          >
            Log progress
          </button>
          <button
            onClick={onFinish}
            className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          >
            Mark as read
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Up-next compact card ─────────────────────────────────────────────────────

function UpNextCard({
  ub,
  onStart,
  onOpen,
}: {
  ub: UserBook;
  onStart: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="nb-card group flex flex-col gap-2 rounded-2xl p-3">
      <button
        onClick={onOpen}
        className="block"
        aria-label={`Open ${ub.book.title}`}
      >
        {ub.book.thumbnail ? (
          <Image
            src={ub.book.thumbnail}
            alt={ub.book.title}
            width={120}
            height={180}
            unoptimized
            className="aspect-[2/3] h-auto w-full rounded-md object-cover shadow-md shadow-zinc-900/20 ring-1 ring-black/5 transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-[2/3] w-full rounded-md bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700" />
        )}
      </button>

      <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-700 dark:text-zinc-200">
        {ub.book.title}
      </p>

      <button
        onClick={onStart}
        className="rounded-full bg-gradient-to-r from-amber-200 to-orange-200 px-2 py-0.5 text-xs font-semibold text-amber-900 transition hover:from-amber-300 hover:to-orange-300 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-100"
      >
        Start reading
      </button>
    </article>
  );
}

// ─── Stats strip card ─────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "sky" | "emerald";
}) {
  const glow = {
    amber: "from-amber-300/30 to-orange-400/20",
    sky: "from-sky-300/30 to-cyan-400/20",
    emerald: "from-emerald-300/30 to-teal-400/20",
  }[accent];

  return (
    <div className="nb-card relative overflow-hidden rounded-2xl p-3 sm:p-4">
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${glow} blur-2xl`}
      />
      <p className="nb-eyebrow text-[10px] sm:text-xs">{label}</p>
      <p className="mt-0.5 bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-zinc-50 dark:to-zinc-300 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

// ─── Empty state when nothing is currently being read ─────────────────────────

function EmptyReadingState({
  hasBooks,
  upNext,
  onStart,
}: {
  hasBooks: boolean;
  upNext: UserBook[];
  onStart: (id: number) => void;
}) {
  if (!hasBooks) {
    return (
      <div className="nb-surface flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
        <BookIcon className="h-10 w-10 text-amber-400" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Start your reading journey
        </h3>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Search for any book above and add it to your library. Track your
          progress, take notes, and watch your reading add up.
        </p>
      </div>
    );
  }

  if (upNext.length === 0) {
    return (
      <div className="nb-surface flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
        <BookIcon className="h-10 w-10 text-amber-400" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Nothing on the reading pile
        </h3>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Add a book to your library to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="nb-surface flex flex-col gap-4 rounded-2xl p-5">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Pick something from your shelf to start reading:
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {upNext.map((ub) => (
          <UpNextCard
            key={ub.id}
            ub={ub}
            onStart={() => onStart(ub.id)}
            onOpen={() => onStart(ub.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greetingForHour(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function headlineFor(
  readThisYear: number | undefined,
  currentlyReadingCount: number
): string {
  if (readThisYear == null) return "Welcome back.";
  if (readThisYear === 0 && currentlyReadingCount === 0) {
    return "Ready to start something new?";
  }
  if (currentlyReadingCount > 0 && readThisYear > 0) {
    return `You've finished ${readThisYear} book${
      readThisYear === 1 ? "" : "s"
    } this year — keep going.`;
  }
  if (readThisYear > 0) {
    return `${readThisYear} book${
      readThisYear === 1 ? "" : "s"
    } down this year. What's next?`;
  }
  return "Let's keep the streak alive.";
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
