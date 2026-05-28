import { describe, it, expect, vi, beforeEach } from "vitest";
import { libraryList, libraryAdd, libraryUpdate, libraryRemove } from "../../src/commands/library.js";
import * as client from "../../src/api/client.js";
import * as auth from "../../src/auth.js";
import { TokenError } from "../../src/auth.js";

beforeEach(() => vi.restoreAllMocks());

const MOCK_USER_BOOK = {
  id: 101, status_id: 2, rating: null, date_added: "2026-01-15",
  book: { id: 1, title: "Dune" },
};

describe("libraryList", () => {
  it("returns user books without status filter", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      me: [{ id: 1, user_books: [MOCK_USER_BOOK] }],
    });
    const result = await libraryList({ limit: 20 });
    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe("reading");
    expect(spy).toHaveBeenCalledWith("tok", expect.not.stringContaining("_eq"), { limit: 20 });
  });

  it("passes status_id in query when status provided", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      me: [{ id: 1, user_books: [] }],
    });
    await libraryList({ status: "reading", limit: 10 });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("_eq"), { limit: 10 });
  });

  it("throws TokenError when no token", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce(null);
    await expect(libraryList({ limit: 20 })).rejects.toThrow(TokenError);
  });
});

describe("libraryAdd", () => {
  it("calls insert_user_book with correct variables", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      insert_user_book: { id: 1, user_book: { id: 101, status_id: 1 } },
    });
    await libraryAdd({ bookId: 999, status: "want" });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("insert_user_book"), {
      bookId: 999,
      statusId: 1,
    });
  });
});

describe("libraryUpdate", () => {
  it("builds mutation with only provided fields", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      update_user_book: { id: 1, user_book: { id: 101, status_id: 3, rating: 4.5, review: null } },
    });
    await libraryUpdate({ id: 101, rating: 4.5 });
    expect(spy).toHaveBeenCalledWith(
      "tok",
      expect.stringContaining("$rating"),
      expect.objectContaining({ rating: 4.5 })
    );
    expect(spy).not.toHaveBeenCalledWith("tok", expect.stringContaining("$statusId"), expect.anything());
  });
});

describe("libraryRemove", () => {
  it("calls delete_user_book with id", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      delete_user_book: { id: 101 },
    });
    await libraryRemove({ id: 101 });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("delete_user_book"), { id: 101 });
  });
});
