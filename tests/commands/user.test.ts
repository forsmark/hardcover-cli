import { describe, it, expect, vi, beforeEach } from "vitest";
import { userMe } from "../../src/commands/user.js";
import * as client from "../../src/api/client.js";
import * as auth from "../../src/auth.js";
import { TokenError } from "../../src/auth.js";

beforeEach(() => vi.restoreAllMocks());

const MOCK_USER = {
  id: 1,
  username: "marc",
  name: "Marc",
  bio: null,
  books_count: 42,
  followers_count: 10,
  followed_users_count: 5,
  pro: false,
};

describe("userMe", () => {
  it("returns current user data", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce("token123");
    const spy = vi.spyOn(client, "gqlRequest").mockResolvedValueOnce({ me: [MOCK_USER] });
    const result = await userMe();
    expect(result.username).toBe("marc");
    expect(result.books_count).toBe(42);
    expect(spy).toHaveBeenCalledWith("token123", expect.any(String));
  });

  it("throws TokenError when no token", async () => {
    vi.spyOn(auth, "getToken").mockResolvedValueOnce(null);
    await expect(userMe()).rejects.toThrow(TokenError);
  });
});
