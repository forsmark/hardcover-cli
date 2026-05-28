import { describe, it, expect, vi, beforeEach } from "vitest";
import { booksSearch, booksGet } from "../../src/commands/books.js";
import * as client from "../../src/api/client.js";
import * as auth from "../../src/auth.js";
import { TokenError } from "../../src/auth.js";

beforeEach(() => vi.restoreAllMocks());

describe("booksSearch", () => {
  it("calls search query with correct variables", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      search: { ids: [1, 2], results: [] },
    });
    await booksSearch({ query: "Dune", type: "Book", limit: 5 });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("search"), {
      query: "Dune",
      queryType: "Book",
      perPage: 5,
    });
  });

  it("throws TokenError when no token", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce(null);
    await expect(booksSearch({ query: "x", type: "Book", limit: 10 })).rejects.toThrow(TokenError);
  });
});

describe("booksGet", () => {
  it("returns book data", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      books_by_pk: { id: 1, title: "Dune", subtitle: null, pages: 412, rating: 4.5, contributions: [] },
    });
    const result = await booksGet({ id: 1 });
    expect(result?.title).toBe("Dune");
  });

  it("returns null when book not found", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ books_by_pk: null });
    const result = await booksGet({ id: 99999 });
    expect(result).toBeNull();
  });
});
