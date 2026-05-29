// Canonical error model shared across the agent CLIs. See ../../CLI_ARCHITECTURE.md §3.
import { ApiError } from "./api/client.js";
import { TokenError } from "./auth.js";

export const ERROR_CODES = {
  AUTH_MISSING: "AUTH_MISSING",
  AUTH_INVALID: "AUTH_INVALID",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  HTTP: "HTTP",
  NETWORK: "NETWORK",
  SCHEMA: "SCHEMA",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface ErrorJSON {
  error: {
    code: ErrorCode;
    message: string;
    status: number | null;
    details: unknown;
  };
}

export class HardcoverError extends Error {
  readonly code: ErrorCode;
  readonly status: number | null;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, opts: { status?: number; details?: unknown } = {}) {
    super(message);
    this.name = "HardcoverError";
    this.code = code;
    this.status = opts.status ?? null;
    this.details = opts.details ?? null;
  }

  toJSON(): ErrorJSON {
    return {
      error: { code: this.code, message: this.message, status: this.status, details: this.details },
    };
  }
}

export function exitCodeFor(code: ErrorCode): number {
  switch (code) {
    case "AUTH_MISSING":
    case "AUTH_INVALID":
      return 2;
    case "VALIDATION":
      return 3;
    case "NOT_FOUND":
      return 4;
    case "NETWORK":
      return 5;
    case "SCHEMA":
      return 6;
    case "HTTP":
    default:
      return 1;
  }
}

// Maps the GraphQL transport errors (ApiError/TokenError) onto the canonical model.
export function toHardcoverError(err: unknown): HardcoverError {
  if (err instanceof HardcoverError) return err;
  if (err instanceof TokenError) return new HardcoverError("AUTH_MISSING", err.message);
  if (err instanceof ApiError) {
    const code: ErrorCode =
      err.status === 401 ? "AUTH_INVALID" : err.status === 403 ? "AUTH_INVALID" : "HTTP";
    return new HardcoverError(code, err.message, { status: err.status || undefined });
  }
  if (err instanceof Error && err.message === "fetch_failed") {
    return new HardcoverError("NETWORK", "Could not reach the Hardcover API. Check your connection.");
  }
  const message = err instanceof Error ? err.message : String(err);
  return new HardcoverError("HTTP", message);
}
