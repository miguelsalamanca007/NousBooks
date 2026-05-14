import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  authApi,
  booksApi,
  notesApi,
  statsApi,
  userApi,
  userBooksApi,
} from "./api";
import { useAuthStore } from "@/store/auth";

const fetchMock = vi.fn();

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  useAuthStore.setState({ token: null });
});

describe("api request helper", () => {
  it("sends JSON content-type and no Authorization for public auth routes", async () => {
    useAuthStore.setState({ token: "stored-token" });
    fetchMock.mockResolvedValueOnce(mockResponse({ token: "jwt" }));

    await authApi.login("a@b.com", "pw");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("attaches Bearer token for protected routes", async () => {
    useAuthStore.setState({ token: "stored-token" });
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await userBooksApi.getMyBooks();

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer stored-token"
    );
  });

  it("returns undefined on 204 No Content", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response);

    const result = await userBooksApi.remove(1);

    expect(result).toBeUndefined();
  });

  it("throws ApiError on non-2xx responses", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ message: "Book not found" }, { status: 404 })
    );

    await expect(notesApi.getById(99)).rejects.toMatchObject({
      status: 404,
      body: { message: "Book not found" },
    });
  });

  it("ApiError is an Error subclass", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({}, { status: 500 }));

    try {
      await notesApi.getById(1);
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it("logs the user out on 401 for protected routes", async () => {
    useAuthStore.setState({ token: "expired" });
    fetchMock.mockResolvedValueOnce(mockResponse({}, { status: 401 }));

    await expect(userApi.getMe()).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().token).toBeNull();
  });

  it("does NOT log out on 401 for /api/auth/* routes", async () => {
    useAuthStore.setState({ token: "keep-me" });
    fetchMock.mockResolvedValueOnce(mockResponse({}, { status: 401 }));

    await expect(authApi.login("a@b.com", "pw")).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().token).toBe("keep-me");
  });

  it("falls back to empty body when error body isn't valid JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);

    await expect(statsApi.getMyStats()).rejects.toMatchObject({
      status: 500,
      body: {},
    });
  });
});

describe("auth endpoints", () => {
  it("register POSTs email and password", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ token: "jwt" }));

    await authApi.register("a@b.com", "pw12345!");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/auth/register");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "a@b.com",
      password: "pw12345!",
    });
  });

  it("google POSTs idToken", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ token: "jwt" }));

    await authApi.google("google-token");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ idToken: "google-token" });
  });
});

describe("books endpoints", () => {
  it("search url-encodes the query", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await booksApi.search("the lord & rings");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/books/search?q=the%20lord%20%26%20rings");
  });

  it("searchAdvanced serializes only provided params", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await booksApi.searchAdvanced({
      q: "tolkien",
      author: "tolkien",
      orderBy: "NEWEST",
      page: 0,
      size: 10,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("q=tolkien");
    expect(url).toContain("author=tolkien");
    expect(url).toContain("orderBy=NEWEST");
    expect(url).toContain("page=0");
    expect(url).toContain("size=10");
    expect(url).not.toContain("publisher=");
    expect(url).not.toContain("subject=");
  });
});

describe("user-books endpoints", () => {
  it("add defaults status to TO_READ", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({}));

    await userBooksApi.add("google-id-1");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      googleBooksId: "google-id-1",
      status: "TO_READ",
    });
  });

  it("update PATCHes with id in URL", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({}));

    await userBooksApi.update(42, { status: "READ", rating: 5 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/user-books/42");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "READ", rating: 5 });
  });

  it("remove DELETEs", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response);

    await userBooksApi.remove(7);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/user-books/7");
    expect(init.method).toBe("DELETE");
  });
});

describe("notes endpoints", () => {
  it("create POSTs bookId, content, title", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({}));

    await notesApi.create(10, "content", "title");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      bookId: 10,
      content: "content",
      title: "title",
    });
  });

  it("getByBook hits by-book endpoint", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await notesApi.getByBook(10);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/notes/by-book/10");
  });
});

describe("user endpoints", () => {
  it("changePassword POSTs body", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as unknown as Response);

    await userApi.changePassword({ currentPassword: "old", newPassword: "newer" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/users/me/password");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      currentPassword: "old",
      newPassword: "newer",
    });
  });
});
