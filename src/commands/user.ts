import { Command } from "commander";
import { gqlRequest } from "../api/client.js";
import { getToken, TokenError } from "../auth.js";
import { ME_QUERY } from "../api/queries.js";
import { MeResponseSchema } from "../schemas/user.js";
import type { User } from "../schemas/user.js";
import { handleCommandError } from "./auth.js";

const USER_ME_EXAMPLE: User = {
  id: 1,
  username: "janereader",
  name: "Jane Reader",
  bio: "Avid reader of all genres.",
  books_count: 42,
  followers_count: 10,
  followed_users_count: 5,
  pro: false,
};

export async function userMe(): Promise<User> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ me: User[] }>(token, ME_QUERY);
  const parsed = MeResponseSchema.parse(data);
  return parsed.me[0]!;
}

export function registerUserCommands(program: Command): void {
  const user = program.command("user").description("User profile operations");

  user
    .command("me")
    .description("Get current user profile")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(USER_ME_EXAMPLE, null, 2));
        return;
      }
      try {
        const result = await userMe();
        if (opts.pretty) {
          console.log(
            `${result.name ?? result.username} (@${result.username})`
          );
          console.log(
            `Books: ${result.books_count} | Followers: ${result.followers_count} | Following: ${result.followed_users_count}`
          );
          if (result.pro) console.log("Pro member");
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });
}
