package com.miguelsalamanca.nousbooks.enums;

public enum PrintType {
    BOOKS("books"),
    MAGAZINES("magazines"),
    ALL("all");

    private final String value;

    PrintType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
