"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, userBooksApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import BookIcon from "@/components/BookIcon";

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
      className={`text-base font-medium transition-colors ${
        pathname === href
          ? "text-zinc-900"
          : "text-zinc-600 hover:text-zinc-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-amber-50/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-black">
          <BookIcon className="h-5 w-5" />
          Nous Books
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-5">
          {navLink("/dashboard", "Home")}
          {navLink("/my-books", "My Books")}
          {navLink("/notes", "My Notes")}
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
            aria-label="Search books"
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
          />

          {open && debouncedQuery.length > 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg">
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
                    <p className="truncate text-sm font-medium text-zinc-600">{book.title}</p>
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
                    className="shrink-0 rounded-full border border-zinc-400 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-amber-100"
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
            queryClient.clear();
            logout();
            router.push("/login");
          }}
          aria-label="Sign out"
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
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
      </div>
    </header>
  );
}
