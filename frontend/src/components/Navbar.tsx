"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import BookIcon from "@/components/BookIcon";
import UserMenu from "@/components/UserMenu";
import { BookSearchResult } from "@/types";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/my-books", label: "My Books" },
  { href: "/notes", label: "My Notes" },
  { href: "/stats", label: "Stats" },
];

// ── ResultsDropdown ──────────────────────────────────────────────────────────
// Declared outside the Navbar component because Next 16's react-hooks rules
// reject components defined in render bodies — they would lose state on every
// parent render. This is purely presentational; all state lives in Navbar and
// is passed in via props.
function ResultsDropdown({
  results,
  isFetching,
  query,
  onAdd,
  onSeeAll,
}: {
  results: BookSearchResult[];
  isFetching: boolean;
  query: string;
  onAdd: (googleBooksId: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {isFetching && (
        <p className="px-4 py-3 text-sm text-zinc-400">Searching…</p>
      )}
      {!isFetching && results.length === 0 && (
        <p className="px-4 py-3 text-sm text-zinc-400">No results</p>
      )}
      {results.slice(0, 6).map((book) => (
        <div
          key={book.googleBooksId}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {book.thumbnail ? (
            <Image
              src={book.thumbnail}
              alt={book.title}
              width={28}
              height={40}
              unoptimized
              className="h-10 w-7 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-7 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {book.title}
            </p>
            {book.authors?.length > 0 && (
              <p className="truncate text-xs text-zinc-400">
                {book.authors[0]}
              </p>
            )}
          </div>
          <button
            onClick={() => onAdd(book.googleBooksId)}
            className="shrink-0 rounded-full border border-zinc-400 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-amber-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-amber-900/40"
          >
            + Add
          </button>
        </div>
      ))}
      {!isFetching && results.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          <button
            onClick={onSeeAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
          >
            See all results for &ldquo;{query}&rdquo;
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["bookSearch", debouncedQuery],
    queryFn: () => booksApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  const addBook = useMutation({
    mutationFn: (googleBooksId: string) =>
      userBooksApi.add(googleBooksId, "TO_READ"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBooks"] });
    },
  });

  function handleAddBook(googleBooksId: string) {
    addBook.mutate(googleBooksId);
    setOpen(false);
    setQuery("");
    setMobileSearchOpen(false);
  }

  function handleSeeAll() {
    setOpen(false);
    setMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
  }

  function closeMobilePanels() {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
  }

  const navLinkClass = (href: string) =>
    `text-base font-medium transition-colors ${
      pathname === href
        ? "text-zinc-900 dark:text-zinc-100"
        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
    }`;

  const showDropdown = open && debouncedQuery.length > 2;

  return (
    <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-amber-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      {/* ── Main row ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6 sm:px-6">

        {/* Logo */}
        <Link
          href="/dashboard"
          onClick={closeMobilePanels}
          className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-black dark:text-zinc-100"
        >
          <BookIcon className="h-5 w-5" />
          <span>Nous Books</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass(href)}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div ref={searchRef} className="relative ml-auto hidden w-64 md:block">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.length > 2 && setOpen(true)}
            placeholder="Search..."
            aria-label="Search books"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
          {showDropdown && (
            <ResultsDropdown
              results={results}
              isFetching={isFetching}
              query={debouncedQuery}
              onAdd={handleAddBook}
              onSeeAll={handleSeeAll}
            />
          )}
        </div>

        {/* Desktop user menu */}
        <div className="hidden md:block">
          <UserMenu />
        </div>

        {/* Mobile right controls */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {/* Search icon */}
          <button
            onClick={() => { setMobileSearchOpen((v) => !v); setMenuOpen(false); }}
            aria-label="Search"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 4.65 4.65a7.5 7.5 0 0 0 12 12z"
              />
            </svg>
          </button>

          {/* User menu (avatar) */}
          <UserMenu />

          {/* Hamburger — nav links only on mobile */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => { setMenuOpen((v) => !v); setMobileSearchOpen(false); }}
              aria-label="Menu"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {menuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>

            {/* Dropdown menu — nav only; sign-out etc. live in UserMenu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobilePanels}
                    className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                      pathname === href
                        ? "bg-amber-50 text-zinc-900 dark:bg-amber-950/40 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile search bar (slide-down) ───────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="border-t border-amber-200/60 bg-amber-50/80 px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-900/80">
          <div ref={mobileSearchRef} className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => query.length > 2 && setOpen(true)}
              placeholder="Search books..."
              aria-label="Search books"
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {showDropdown && (
              <ResultsDropdown
                results={results}
                isFetching={isFetching}
                query={debouncedQuery}
                onAdd={handleAddBook}
                onSeeAll={handleSeeAll}
              />
            )}
          </div>
        </div>
      )}
    </header>
  );
}
