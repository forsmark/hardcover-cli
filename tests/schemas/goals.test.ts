import { describe, it, expect } from "vitest";
import { GoalCreateInputSchema, GoalUpdateInputSchema, GoalDeleteInputSchema } from "../../src/schemas/goals.js";

describe("GoalCreateInputSchema", () => {
  it("parses valid input", () => {
    const r = GoalCreateInputSchema.parse({
      metric: "books", target: "12", start: "2026-01-01", end: "2026-12-31",
    });
    expect(r.target).toBe(12);
  });

  it("rejects invalid date format", () => {
    expect(() =>
      GoalCreateInputSchema.parse({ metric: "books", target: 12, start: "01/01/2026", end: "2026-12-31" })
    ).toThrow("Start date must be YYYY-MM-DD");
  });

  it("rejects invalid metric", () => {
    expect(() =>
      GoalCreateInputSchema.parse({ metric: "chapters", target: 12, start: "2026-01-01", end: "2026-12-31" })
    ).toThrow();
  });
});

describe("GoalUpdateInputSchema", () => {
  it("rejects when target not provided", () => {
    expect(() => GoalUpdateInputSchema.parse({ id: 1 })).toThrow("At least --target must be provided");
  });
});

describe("GoalDeleteInputSchema", () => {
  it("rejects non-positive id", () => {
    expect(() => GoalDeleteInputSchema.parse({ id: 0 })).toThrow();
  });
});
