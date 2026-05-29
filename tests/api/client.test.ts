import { describe, it, expect, vi, beforeEach } from "vitest";
import { gqlRequest, ApiError } from "../../src/api/client.js";

const ENDPOINT = "https://api.hardcover.app/v1/graphql";

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => vi.restoreAllMocks());

describe("gqlRequest", () => {
  it("returns data on success", async () => {
    mockFetch(200, { data: { me: [{ id: 1 }] } });
    const result = await gqlRequest<{ me: { id: number }[] }>("token123", "query { me { id } }");
    expect(result).toEqual({ me: [{ id: 1 }] });
  });

  it("sends correct headers and body", async () => {
    const spy = mockFetch(200, { data: { me: [{ id: 1 }] } });
    await gqlRequest("mytoken", "query { me { id } }", { foo: "bar" });
    expect(spy).toHaveBeenCalledWith(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer mytoken",
      },
      body: JSON.stringify({ query: "query { me { id } }", variables: { foo: "bar" } }),
    });
  });

  it("throws ApiError with status 401 on 401 response", async () => {
    mockFetch(401, {});
    await expect(gqlRequest("bad", "query {}")).rejects.toThrow(ApiError);
    await expect(gqlRequest("bad", "query {}").catch((e) => e.message)).resolves.toMatch(
      "Token invalid or expired"
    );
  });

  it("throws ApiError on 403", async () => {
    mockFetch(403, {});
    await expect(gqlRequest("t", "q")).rejects.toMatchObject({ status: 403 });
  });

  it("throws ApiError on 429", async () => {
    mockFetch(429, {});
    await expect(gqlRequest("t", "q")).rejects.toMatchObject({ status: 429 });
  });

  it("throws ApiError on 500", async () => {
    mockFetch(500, {});
    await expect(gqlRequest("t", "q")).rejects.toMatchObject({ status: 500 });
  });

  it("throws on GraphQL errors array", async () => {
    mockFetch(200, { errors: [{ message: "Not found" }] });
    await expect(gqlRequest("t", "q")).rejects.toThrow("Not found");
  });

  it("throws when data is missing", async () => {
    mockFetch(200, {});
    await expect(gqlRequest("t", "q")).rejects.toThrow("No data");
  });
});
