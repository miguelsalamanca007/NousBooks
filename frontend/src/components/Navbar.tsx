"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import BookIcon from "@/components/BookIcon";
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
  onAdd,
}: {
  results: BookSearchResult[];
  isFetching: boolean;
  onAdd: (googleBooksId: string) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg z-50">
      {isFetching && (
        <p className="px-4 py-3 text-sm text-zinc-400">Searching…</p>
      )}
      {!isFetching && results.length === 0 && (
        <p className="px-4 py-3 text-sm text-zinc-400">No results</p>
      )}
      {results.slice(0, 6).map((book) => (
        <div
          key={book.googleBooksId}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50"
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
            <div className="h-10 w-7 shrink-0 rounded bg-zinc-100" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-600">
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
            className="shrink-0 rounded-full border border-zinc-400 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-amber-100"
          >
            + Add
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
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

  // NOTE: closing mobile panels on route change is handled via onClick on each
  // Link, not a useEffect on `pathname`. Next 16's react-hooks rules forbid
  // synchronous setState inside an effect because it triggers cascading
  // renders.

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

  function handleSignOut() {
    queryClient.clear();
    logout();
    router.push("/login");
  }

  function closeMobilePanels() {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
  }

  const navLinkClass = (href: string) =>
    `text-base font-medium transition-colors ${
      pathname === href ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
    }`;

  const showDropdown = open && debouncedQuery.length > 2;

  return (
    <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-amber-50/80 backdrop-blur">
      {/* ── Main row ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6 sm:px-6">

        {/* Logo */}
        <Link
          href="/dashboard"
          onClick={closeMobilePanels}
          className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-black"
        >
          <BookIcon className="h-5 w-5" />
          <span>Nous Books</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
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
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
          />
          {showDropdown && (
            <ResultsDropdown
              results={results}
              isFetching={isFetching}
              onAdd={handleAddBook}
            />
          )}
        </div>

        {/* Desktop sign out */}
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="hidden md:block shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path
              fillRule="evenodd"
              d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Mobile right controls */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {/* Search icon */}
          <button
            onClick={() => { setMobileSearchOpen((v) => !v); setMenuOpen(false); }}
            aria-label="Search"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
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

          {/* Hamburger */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => { setMenuOpen((v) => !v); setMobileSearchOpen(false); }}
              aria-label="Menu"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
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

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobilePanels}
                    className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                      pathname === href
                        ? "bg-amber-50 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-zinc-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile search bar (slide-down) ───────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="border-t border-amber-200/60 bg-amber-50/80 px-4 py-3 md:hidden">
          <div ref={mobileSearchRef} className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => query.length > 2 && setOpen(true)}
              placeholder="Search books..."
              aria-label="Search books"
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
            />
            {showDropdown && (
              <ResultsDropdown
                results={results}
                isFetching={isFetching}
                onAdd={handleAddBook}
              />
            )}
          </div>
        </div>
      )}
    </header>
  );
}
