import { describe, it, expect, vi, beforeEach } from "vitest";
import { maskToken } from "../../src/auth.js";

describe("maskToken", () => {
  it("masks all but last 4 chars", () => {
    expect(maskToken("abcdefgh")).toBe("****efgh");
  });

  it("handles token shorter than 4 chars", () => {
    expect(maskToken("ab")).toBe("****");
  });

  it("handles exactly 4 chars", () => {
    expect(maskToken("abcd")).toBe("****abcd");
  });
});
