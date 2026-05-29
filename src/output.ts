// Canonical output layer. stdout = JSON data only; stderr = error JSON. See ../../CLI_ARCHITECTURE.md §1.
import { z } from "zod";
import { HardcoverError, exitCodeFor, toHardcoverError } from "./errors.js";

type Writer = (s: string) => void;

const out: Writer = (s) => process.stdout.write(s);
const err: Writer = (s) => process.stderr.write(s);

export function writeData(data: unknown, opts: { pretty?: boolean; writer?: Writer } = {}): void {
  const w = opts.writer ?? out;
  w(JSON.stringify(data, null, opts.pretty ? 2 : 0) + "\n");
}

export function writeError(e: unknown, opts: { writer?: Writer } = {}): void {
  const w = opts.writer ?? err;
  w(JSON.stringify(toHardcoverError(e).toJSON()) + "\n");
}

// Write a contract-compliant error to stderr and exit with the mapped code.
export function fail(e: unknown): never {
  const he = toHardcoverError(e);
  writeError(he);
  process.exit(exitCodeFor(he.code));
}

// Turn a failed zod parse into a VALIDATION error and exit 3.
export function failValidation(error: z.ZodError): never {
  fail(new HardcoverError("VALIDATION", error.issues[0]?.message ?? "Invalid input", {
    details: error.issues,
  }));
}

// Emit a not-found error and exit 4.
export function failNotFound(message: string): never {
  fail(new HardcoverError("NOT_FOUND", message));
}
