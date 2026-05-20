-- V11: store authors and publisher on books.
--
-- `authors` is stored as a semicolon-separated TEXT because Google Books
-- returns a list and creating a join table for read-mostly metadata isn't
-- worth the complexity. The mapper splits it back into a list for the DTO.
-- `publisher` is a single string straight from the Google Books volumeInfo.
-- Both nullable: existing rows stay valid and old books simply omit the
-- fields in the UI until the user adds a new copy.

ALTER TABLE books ADD COLUMN authors   TEXT;
ALTER TABLE books ADD COLUMN publisher VARCHAR(500);
