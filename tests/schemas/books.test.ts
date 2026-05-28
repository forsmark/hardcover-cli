import { describe, it, expect } from "vitest";
import { BookSearchInputSchema, BookGetInputSchema, BookSchema } from "../../src/schemas/books.js";

describe("BookSearchInputSchema", () => {
  it("applies defaults", () => {
    const r = BookSearchInputSchema.parse({ query: "Dune" });
    expect(r.type).toBe("Book");
    expect(r.limit).toBe(10);
  });

  it("rejects empty query", () => {
    expect(() => BookSearchInputSchema.parse({ query: "" })).toThrow("Query cannot be empty");
  });

  it("rejects unknown type", () => {
    expect(() => BookSearchInputSchema.parse({ query: "x", type: "Invalid" })).toThrow();
  });
});

describe("BookGetInputSchema", () => {
  it("rejects non-positive id", () => {
    expect(() => BookGetInputSchema.parse({ id: 0 })).toThrow();
    expect(() => BookGetInputSchema.parse({ id: -1 })).toThrow();
  });
});

describe("BookSchema", () => {
  it("defaults contributions to empty array", () => {
    const r = BookSchema.parse({ id: 1, title: "Dune", subtitle: null, pages: null, rating: null });
    expect(r.contributions).toEqual([]);
  });
});
