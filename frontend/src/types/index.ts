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
  bookId: number;
  bookTitle: string | null;
  title: string | null;
  content: string;
  createdAt: string;
}
