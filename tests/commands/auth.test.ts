import { describe, it, expect, vi, beforeEach } from "vitest";
import { authStatus } from "../../src/commands/auth.js";
import * as client from "../../src/api/client.js";
import * as auth from "../../src/auth.js";

beforeEach(() => vi.restoreAllMocks());

describe("authStatus", () => {
  it("returns masked token and username on success", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("abcdefghijkl");
    vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ me: [{ id: 1, username: "marc" }] });
    const result = await authStatus();
    expect(result.username).toBe("marc");
    expect(result.maskedToken).toBe("****ijkl");
  });

  it("throws TokenError when no token stored", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce(null);
    await expect(authStatus()).rejects.toThrow("No token found");
  });
});
