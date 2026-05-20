export interface AuthResponse {
  token: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: string;
}

export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string;
  publishedDate: string;
}

export interface Book {
  id: number;
  googleBooksId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedDate: string;
  pageCount: number | null;
}

export type ReadingStatus = "TO_READ" | "READING" | "READ";

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  TO_READ: "Want to read",
  READING: "Reading",
  READ: "Read",
};

export const STATUS_COLORS: Record<ReadingStatus, string> = {
  TO_READ: "nb-pill-to-read",
  READING: "nb-pill-reading",
  READ:    "nb-pill-read",
};

export interface UserBook {
  id: number;
  book: Book;
  status: ReadingStatus;
  rating: number | null;
  review: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  currentPage: number | null;
}

export interface Note {
  id: number;
  bookId: number | null;
  bookTitle: string | null;
  title: string | null;
  content: string;
  createdAt: string;
}

export interface MonthlyCount {
  month: string; // ISO YYYY-MM
  count: number;
}

export interface Stats {
  totalBooks: number;
  booksByStatus: Record<ReadingStatus, number>;
  totalNotes: number;
  readThisYear: number;
  finishedByMonth: MonthlyCount[];
  memberSince: string;
}

export interface Highlight {
  id: number;
  book: Book;
  text: string;
  note: string | null;
  pageNumber: number | null;
  createdAt: string;
  // Only present on /search responses. Cosine distance — lower is closer.
  relevance?: number;
}
