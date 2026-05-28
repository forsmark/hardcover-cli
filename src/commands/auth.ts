import { Command } from "commander";
import * as readline from "readline";
import { z } from "zod";
import { gqlRequest, ApiError } from "../api/client.js";
import { getToken, setToken, removeToken, maskToken, TokenError } from "../auth.js";
import { ME_QUERY } from "../api/queries.js";

const MeIdResponseSchema = z.object({
  me: z.array(z.object({ id: z.number(), username: z.string() })).min(1),
});

export async function authStatus(): Promise<{ username: string; maskedToken: string }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ me: { id: number; username: string }[] }>(token, ME_QUERY);
  const parsed = MeIdResponseSchema.parse(data);
  const user = parsed.me[0]!;

  return { username: user.username, maskedToken: maskToken(token) };
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth").description("Manage API token");

  auth
    .command("set")
    .description("Store your Hardcover API token")
    .option("--example", "Show example output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify({ success: true }));
        return;
      }
      const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
      const token = await new Promise<string>((resolve) => {
        rl.question("Enter your Hardcover API token: ", (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (!token) {
        console.error("Token cannot be empty.");
        process.exit(1);
      }
      await setToken(token);
      console.log(JSON.stringify({ success: true }));
    });

  auth
    .command("remove")
    .description("Remove stored API token")
    .option("--example", "Show example output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify({ success: true }));
        return;
      }
      await removeToken();
      console.log(JSON.stringify({ success: true }));
    });

  auth
    .command("status")
    .description("Verify stored token is valid")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify({ username: "marc", maskedToken: "****abcd" }));
        return;
      }
      try {
        const result = await authStatus();
        if (opts.pretty) {
          console.log(`Token valid. Logged in as: ${result.username} (token: ${result.maskedToken})`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });
}

export function handleCommandError(err: unknown): never {
  if (err instanceof TokenError) {
    console.error(err.message);
    process.exit(1);
  }
  if (err instanceof ApiError) {
    console.error(err.message);
    process.exit(2);
  }
  if (err instanceof Error && err.message === "fetch_failed") {
    console.error("Could not reach the Hardcover API. Check your connection.");
    process.exit(3);
  }
  console.error(String(err));
  process.exit(2);
}
