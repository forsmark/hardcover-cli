import { readFileSync } from "fs";
import { join } from "path";

const SERVICE = "hardcover-cli";
const ACCOUNT = "token";

export class TokenError extends Error {
  constructor() {
    super("No token found. Run `auth set` to store one.");
    this.name = "TokenError";
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const keytar = await import("keytar");
    const token = await keytar.default.getPassword(SERVICE, ACCOUNT);
    if (token) return token;
  } catch {}

  if (process.env["HARDCOVER_API_TOKEN"]) return process.env["HARDCOVER_API_TOKEN"];

  try {
    const content = readFileSync(join(process.cwd(), ".env"), "utf8");
    const match = content.match(/^HARDCOVER_API_TOKEN=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {}

  return null;
}

export async function setToken(token: string): Promise<void> {
  const keytar = await import("keytar");
  await keytar.default.setPassword(SERVICE, ACCOUNT, token);
}

export async function removeToken(): Promise<void> {
  const keytar = await import("keytar");
  await keytar.default.deletePassword(SERVICE, ACCOUNT);
}

export function maskToken(token: string): string {
  if (token.length < 6) return "****";
  return `****${token.slice(-6)}`;
}
