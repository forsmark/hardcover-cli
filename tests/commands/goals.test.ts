import { describe, it, expect, vi, beforeEach } from "vitest";
import { goalsList, goalsCreate, goalsUpdate, goalsDelete } from "../../src/commands/goals.js";
import * as client from "../../src/api/client.js";
import * as auth from "../../src/auth.js";
import { TokenError } from "../../src/auth.js";

beforeEach(() => vi.restoreAllMocks());

const MOCK_GOAL = { id: 1, metric: "books", goal: 12, progress: 5, state: "active", start_date: "2026-01-01", end_date: "2026-12-31" };

describe("goalsList", () => {
  it("returns goals for current user", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ me: [{ id: 1, goals: [MOCK_GOAL] }] });
    const result = await goalsList();
    expect(result).toHaveLength(1);
    expect(result[0]!.metric).toBe("books");
  });

  it("throws TokenError when no token", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce(null);
    await expect(goalsList()).rejects.toThrow(TokenError);
  });
});

describe("goalsCreate", () => {
  it("calls insert_goal with correct variables", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({
      insert_goal: { id: 1, goal: { id: 1, progress: 0, state: "active" } },
    });
    await goalsCreate({ metric: "books", target: 12, start: "2026-01-01", end: "2026-12-31" });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("insert_goal"), {
      metric: "books", target: 12, start: "2026-01-01", end: "2026-12-31",
    });
  });
});

describe("goalsUpdate", () => {
  it("calls update_goal with id and target", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ update_goal: { id: 1 } });
    await goalsUpdate({ id: 1, target: 24 });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("update_goal"), { id: 1, target: 24 });
  });
});

describe("goalsDelete", () => {
  it("calls delete_goal with id", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("tok");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ delete_goal: { id: 1 } });
    await goalsDelete({ id: 1 });
    expect(spy).toHaveBeenCalledWith("tok", expect.stringContaining("delete_goal"), { id: 1 });
  });
});
