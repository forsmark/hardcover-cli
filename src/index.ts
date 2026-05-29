#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerBooksCommands } from "./commands/books.js";
import { registerLibraryCommands } from "./commands/library.js";
import { registerGoalsCommands } from "./commands/goals.js";
import { registerUserCommands } from "./commands/user.js";
import { fail } from "./output.js";

const program = new Command();

program
  .name("hardcover")
  .description("CLI for the Hardcover book tracking API")
  .version("1.0.0");

registerAuthCommands(program);
registerBooksCommands(program);
registerLibraryCommands(program);
registerGoalsCommands(program);
registerUserCommands(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  fail(err);
});
