package com.miguelsalamanca.nousbooks.enums;

public enum OrderBy {
    RELEVANCE("relevance"),
    NEWEST("newest");

    private final String value;

    OrderBy(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
