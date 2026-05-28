const ENDPOINT = "https://api.hardcover.app/v1/graphql";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function gqlRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error("fetch_failed");
  }

  if (res.status === 401)
    throw new ApiError(401, "Token invalid or expired. Run `auth set` to update it.");
  if (res.status === 403)
    throw new ApiError(403, "Access denied — you may not have permission to this resource.");
  if (res.status === 429)
    throw new ApiError(429, "Rate limited (60 req/min). Try again in a moment.");
  if (res.status >= 500)
    throw new ApiError(res.status, "Hardcover API error. Try again later.");

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) throw new ApiError(0, json.errors[0].message);
  if (!json.data) throw new ApiError(0, "No data in API response.");

  return json.data;
}
