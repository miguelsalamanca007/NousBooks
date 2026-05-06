-- V7: reading-progress support.
--
-- `books.page_count` is captured from Google Books on first lookup and is
-- nullable because the Google Books API doesn't always return it. The
-- frontend lets the user fill it in manually when it's missing.
--
-- `user_books.current_page` tracks how far the user has read into a book.
-- Nullable so existing rows stay valid; the UI treats null as "no progress
-- recorded yet" and falls back to 0 for the progress bar.

ALTER TABLE books      ADD COLUMN page_count   INTEGER;
ALTER TABLE user_books ADD COLUMN current_page INTEGER;
