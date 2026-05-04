-- V6: support reading statistics.
--
-- We need to know when each book entered the library and when the user
-- finished reading it. Until now neither was reliably tracked: started_at
-- and finished_at were only populated when the client passed them in
-- (which the current frontend never does), and there was no created_at at
-- all on user_books.
--
-- This migration adds created_at and backfills the time columns for
-- existing rows, using created_at as a best-effort proxy. From here on
-- the application layer auto-sets started_at / finished_at when the user
-- moves a book between reading-status columns.

ALTER TABLE user_books
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- For pre-existing rows we don't know the real reading dates, so we treat
-- created_at as the moment the book reached its current state. That keeps
-- the per-month chart from being an empty wall on day one.
UPDATE user_books
   SET started_at = created_at
 WHERE started_at IS NULL
   AND status IN ('READING', 'READ');

UPDATE user_books
   SET finished_at = created_at
 WHERE finished_at IS NULL
   AND status = 'READ';
