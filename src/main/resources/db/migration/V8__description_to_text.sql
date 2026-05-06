-- V8__books_description_text.sql

-- Changed the type of the description in books since the previous one only
-- allowed 2000 words description or less, which is a limitation for some books

ALTER TABLE books
ALTER COLUMN description TYPE TEXT;
