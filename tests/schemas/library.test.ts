import { describe, it, expect } from "vitest";
import {
  LibraryListInputSchema,
  LibraryAddInputSchema,
  LibraryUpdateInputSchema,
  LibraryRemoveInputSchema,
  STATUS_ID_MAP,
  STATUS_NAME_MAP,
} from "../../src/schemas/library.js";

describe("STATUS maps", () => {
  it("round-trips all statuses", () => {
    for (const [name, id] of Object.entries(STATUS_ID_MAP)) {
      expect(STATUS_NAME_MAP[id]).toBe(name);
    }
  });
});

describe("LibraryListInputSchema", () => {
  it("defaults limit to 20", () => {
    expect(LibraryListInputSchema.parse({}).limit).toBe(20);
  });

  it("coerces string limit", () => {
    expect(LibraryListInputSchema.parse({ limit: "5" }).limit).toBe(5);
  });

  it("rejects invalid status", () => {
    expect(() => LibraryListInputSchema.parse({ status: "bogus" })).toThrow();
  });
});

describe("LibraryAddInputSchema", () => {
  it("defaults status to want", () => {
    expect(LibraryAddInputSchema.parse({ bookId: 1 }).status).toBe("want");
  });

  it("rejects non-positive bookId", () => {
    expect(() => LibraryAddInputSchema.parse({ bookId: 0 })).toThrow();
  });
});

describe("LibraryUpdateInputSchema", () => {
  it("rejects when no update fields provided", () => {
    expect(() => LibraryUpdateInputSchema.parse({ id: 1 })).toThrow(
      "At least one of --status, --rating, or --review must be provided"
    );
  });

  it("passes with only status", () => {
    expect(() => LibraryUpdateInputSchema.parse({ id: 1, status: "read" })).not.toThrow();
  });

  it("passes with only rating", () => {
    expect(() => LibraryUpdateInputSchema.parse({ id: 1, rating: "4.5" })).not.toThrow();
  });
});

describe("LibraryRemoveInputSchema", () => {
  it("rejects non-positive id", () => {
    expect(() => LibraryRemoveInputSchema.parse({ id: -1 })).toThrow();
  });
});
