-- Google Books thumbnail URLs and some titles exceed VARCHAR(255).
ALTER TABLE books ALTER COLUMN thumbnail TYPE TEXT;
ALTER TABLE books ALTER COLUMN title     TYPE VARCHAR(500);
