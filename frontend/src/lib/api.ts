import { useAuthStore } from "@/store/auth";
import {
  AuthResponse,
  BookSearchResult,
  Note,
  ReadingStatus,
  Stats,
  UserBook,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    // If the token is rejected, clear it so the app layout redirects to /login
    // on the next render instead of looping with stale credentials. We skip the
    // auth endpoints themselves so a wrong-password 401 on /login doesn't wipe
    // a still-valid session.
    if (
      res.status === 401 &&
      !path.startsWith("/api/auth/") &&
      typeof window !== "undefined"
    ) {
      useAuthStore.getState().logout();
    }

    throw new ApiError(res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Exchange a Google ID token (obtained on the frontend via Google Identity
  // Services) for a backend-issued JWT.
  google: (idToken: string) =>
    request<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
};

// ── Books ─────────────────────────────────────────────────────────────────────

export const booksApi = {
  search: (q: string) =>
    request<BookSearchResult[]>(`/api/books/search?q=${encodeURIComponent(q)}`),
};

// ── User Books ────────────────────────────────────────────────────────────────

export const userBooksApi = {
  getMyBooks: () => request<UserBook[]>("/api/user-books/me"),

  add: (googleBooksId: string, status: ReadingStatus = "TO_READ") =>
    request<UserBook>("/api/user-books", {
      method: "POST",
      body: JSON.stringify({ googleBooksId, status }),
    }),

  update: (
    id: number,
    data: { status?: ReadingStatus; rating?: number; review?: string }
  ) =>
    request<UserBook>(`/api/user-books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/api/user-books/${id}`, { method: "DELETE" }),
};

// ── Notes ─────────────────────────────────────────────────────────────────────

export const notesApi = {
  getMyNotes: () => request<Note[]>("/api/notes"),

  getById: (id: number) => request<Note>(`/api/notes/${id}`),

  getByBook: (bookId: number) =>
    request<Note[]>(`/api/notes/by-book/${bookId}`),

  create: (bookId: number, content: string, title?: string) =>
    request<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ bookId, content, title }),
    }),

  update: (id: number, data: { title?: string; content?: string }) =>
    request<Note>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/api/notes/${id}`, { method: "DELETE" }),
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const statsApi = {
  getMyStats: () => request<Stats>("/api/stats/me"),
};
