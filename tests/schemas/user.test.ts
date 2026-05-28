import { describe, it, expect } from "vitest";
import { UserSchema, MeResponseSchema } from "../../src/schemas/user.js";

describe("UserSchema", () => {
  it("parses a valid user", () => {
    const result = UserSchema.parse({
      id: 1, username: "marc", name: "Marc", bio: null,
      books_count: 10, followers_count: 5, followed_users_count: 3, pro: false,
    });
    expect(result.id).toBe(1);
  });

  it("rejects missing required fields", () => {
    expect(() => UserSchema.parse({ id: 1 })).toThrow();
  });
});

describe("MeResponseSchema", () => {
  it("rejects empty me array", () => {
    expect(() => MeResponseSchema.parse({ me: [] })).toThrow();
  });
});
