import { describe, it, expect } from "vitest";

const TOKEN = process.env["HARDCOVER_API_TOKEN"];

describe.skipIf(!TOKEN)("smoke: auth status against real API", () => {
  it("returns a valid username", async () => {
    const { authStatus } = await import("../../src/commands/auth.js");
    const result = await authStatus();
    expect(typeof result.username).toBe("string");
    expect(result.username.length).toBeGreaterThan(0);
    expect(result.maskedToken).toMatch(/^\*{4}.{4}$/);
  });
});
