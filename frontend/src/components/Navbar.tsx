"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { BookSearchResult } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
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

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href
          ? "text-zinc-900"
          : "text-zinc-400 hover:text-zinc-700"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        {/* Logo */}
        <Link href="/dashboard" className="text-base font-semibold tracking-tight shrink-0">
          Nous Books
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-5">
          {navLink("/dashboard", "Home")}
          {navLink("/my-books", "My Books")}
          {navLink("/notes", "Notes")}
        </nav>

        {/* Search */}
        <div ref={searchRef} className="relative ml-auto w-64">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.length > 2 && setOpen(true)}
            placeholder="Search..."
            className="w-full rounded-full border border-zinc-300 bg-zinc-50 px-4 py-1.5 text-sm outline-none focus:border-zinc-400 focus:bg-white"
          />

          {open && debouncedQuery.length > 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg">
              {isFetching && (
                <p className="px-4 py-3 text-sm text-zinc-400">Searching…</p>
              )}
              {!isFetching && results.length === 0 && (
                <p className="px-4 py-3 text-sm text-zinc-400">No results</p>
              )}
              {results.slice(0, 6).map((book: BookSearchResult) => (
                <div
                  key={book.googleBooksId}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50"
                >
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="h-10 w-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-7 shrink-0 rounded bg-zinc-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    {book.authors?.length > 0 && (
                      <p className="truncate text-xs text-zinc-400">
                        {book.authors[0]}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      addBook.mutate(book.googleBooksId);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="shrink-0 rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User icon */}
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          title="Sign out"
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path
              fillRule="evenodd"
              d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
