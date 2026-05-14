package com.miguelsalamanca.nousbooks.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.miguelsalamanca.nousbooks.dto.CreateNoteRequest;
import com.miguelsalamanca.nousbooks.dto.NoteDto;
import com.miguelsalamanca.nousbooks.model.Note;
import com.miguelsalamanca.nousbooks.support.TestData;

class NoteMapperTest {

    private final NoteMapper mapper = new NoteMapper();

    @Test
    void toEntity_copiesTitleAndContent() {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setBookId(10L);
        req.setTitle("t");
        req.setContent("c");

        Note note = mapper.toEntity(req);

        assertThat(note.getTitle()).isEqualTo("t");
        assertThat(note.getContent()).isEqualTo("c");
        // toEntity intentionally does not set book/user — those come from the service.
        assertThat(note.getBook()).isNull();
        assertThat(note.getUser()).isNull();
    }

    @Test
    void toDto_includesBookMetadata() {
        Note note = TestData.note(
                3L,
                TestData.user(1L, "a@b.com"),
                TestData.book(10L, "g1", "Book A"),
                "title",
                "content");

        NoteDto dto = mapper.toDto(note);

        assertThat(dto.getId()).isEqualTo(3L);
        assertThat(dto.getTitle()).isEqualTo("title");
        assertThat(dto.getContent()).isEqualTo("content");
        assertThat(dto.getBookId()).isEqualTo(10L);
        assertThat(dto.getBookTitle()).isEqualTo("Book A");
        assertThat(dto.getCreatedAt()).isNotNull();
    }

    @Test
    void toDto_handlesNullBookGracefully() {
        Note note = new Note();
        note.setId(1L);
        note.setTitle("t");
        note.setContent("c");

        NoteDto dto = mapper.toDto(note);

        assertThat(dto.getBookId()).isNull();
        assertThat(dto.getBookTitle()).isNull();
    }
}
