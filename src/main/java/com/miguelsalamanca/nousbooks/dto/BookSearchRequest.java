package com.miguelsalamanca.nousbooks.dto;

import com.miguelsalamanca.nousbooks.enums.OrderBy;
import com.miguelsalamanca.nousbooks.enums.PrintType;

public record BookSearchRequest(
        String query,
        String author,
        String publisher,
        String subject,
        PrintType printType,
        Integer page,
        Integer size,
        OrderBy orderBy
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String query;
        private String author;
        private String publisher;
        private String subject;
        private PrintType printType;
        private Integer page;
        private Integer size;
        private OrderBy orderBy;

        public Builder query(String query) { this.query = query; return this; }
        public Builder author(String author) { this.author = author; return this; }
        public Builder publisher(String publisher) { this.publisher = publisher; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder printType(PrintType printType) { this.printType = printType; return this; }
        public Builder page(Integer page) { this.page = page; return this; }
        public Builder size(Integer size) { this.size = size; return this; }
        public Builder orderBy(OrderBy orderBy) { this.orderBy = orderBy; return this; }

        public BookSearchRequest build() {
            return new BookSearchRequest(query, author, publisher, subject, printType, page, size, orderBy);
        }
    }
}
