export interface AuthResponse {
  token: string;
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
}

export type ReadingStatus = "TO_READ" | "READING" | "READ";

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  TO_READ: "Want to read",
  READING: "Reading",
  READ: "Read",
};

export const STATUS_COLORS: Record<ReadingStatus, string> = {
  TO_READ: "bg-amber-100 text-amber-800",
  READING: "bg-sky-100 text-sky-800",
  READ:    "bg-emerald-100 text-emerald-800",
};

export interface UserBook {
  id: number;
  book: Book;
  status: ReadingStatus;
  rating: number | null;
  review: string | null;
  startedAt: string | null;
  finishedAt: string | null;
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
