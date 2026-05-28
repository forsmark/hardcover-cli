import { Command } from "commander";
import { gqlRequest } from "../api/client.js";
import { getToken, TokenError } from "../auth.js";
import {
  GOALS_LIST_QUERY,
  INSERT_GOAL_MUTATION,
  UPDATE_GOAL_MUTATION,
  DELETE_GOAL_MUTATION,
} from "../api/queries.js";
import {
  GoalSchema,
  GoalCreateInputSchema,
  GoalUpdateInputSchema,
  GoalDeleteInputSchema,
} from "../schemas/goals.js";
import type { Goal } from "../schemas/goals.js";
import { z } from "zod";
import { handleCommandError } from "./auth.js";

const GOALS_LIST_EXAMPLE: Goal[] = [
  { id: 1, metric: "books", goal: 12, progress: 5, state: "active", start_date: "2026-01-01", end_date: "2026-12-31" },
];
const GOALS_CREATE_EXAMPLE = { success: true, id: 2 };
const GOALS_UPDATE_EXAMPLE = { success: true, id: 1 };
const GOALS_DELETE_EXAMPLE = { success: true, id: 1 };

export async function goalsList(): Promise<Goal[]> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ me: { id: number; goals: unknown[] }[] }>(token, GOALS_LIST_QUERY);
  return z.array(GoalSchema).parse(data.me[0]?.goals ?? []);
}

export async function goalsCreate(input: {
  metric: "books" | "pages";
  target: number;
  start: string;
  end: string;
}): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ insert_goal: { id: number; goal: { id: number } } }>(
    token,
    INSERT_GOAL_MUTATION,
    { metric: input.metric, target: input.target, start: input.start, end: input.end }
  );
  return { success: true, id: data.insert_goal.goal.id };
}

export async function goalsUpdate(input: {
  id: number;
  target?: number;
}): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  await gqlRequest(token, UPDATE_GOAL_MUTATION, { id: input.id, target: input.target });
  return { success: true, id: input.id };
}

export async function goalsDelete(input: { id: number }): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  await gqlRequest(token, DELETE_GOAL_MUTATION, { id: input.id });
  return { success: true, id: input.id };
}

export function registerGoalsCommands(program: Command): void {
  const goals = program.command("goals").description("Manage reading goals");

  goals
    .command("list")
    .description("List your reading goals")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(GOALS_LIST_EXAMPLE, null, 2));
        return;
      }
      try {
        const result = await goalsList();
        if (opts.pretty) {
          if (!result.length) { console.log("No goals found."); return; }
          for (const g of result) {
            const pct = g.progress != null ? ` (${g.progress}/${g.goal})` : "";
            console.log(`[${(g.state ?? "unknown").toUpperCase()}] ${g.goal} ${g.metric}${pct} — ${g.start_date} to ${g.end_date} — ID: ${g.id}`);
          }
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  goals
    .command("create")
    .description("Create a new reading goal")
    .requiredOption("--metric <metric>", "Metric: books or pages")
    .requiredOption("--target <n>", "Target number")
    .requiredOption("--start <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--end <date>", "End date (YYYY-MM-DD)")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(GOALS_CREATE_EXAMPLE, null, 2));
        return;
      }
      const input = GoalCreateInputSchema.safeParse({
        metric: opts.metric,
        target: parseInt(opts.target as string, 10),
        start: opts.start,
        end: opts.end,
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await goalsCreate(input.data);
        if (opts.pretty) {
          console.log(`Goal created (ID: ${result.id})`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  goals
    .command("update")
    .description("Update a reading goal")
    .requiredOption("--id <int>", "Goal ID")
    .option("--target <n>", "New target number")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(GOALS_UPDATE_EXAMPLE, null, 2));
        return;
      }
      const input = GoalUpdateInputSchema.safeParse({
        id: parseInt(opts.id as string, 10),
        target: opts.target !== undefined ? parseInt(opts.target as string, 10) : undefined,
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await goalsUpdate(input.data);
        if (opts.pretty) {
          console.log(`Goal ${result.id} updated.`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  goals
    .command("delete")
    .description("Delete a reading goal")
    .requiredOption("--id <int>", "Goal ID")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(GOALS_DELETE_EXAMPLE, null, 2));
        return;
      }
      const input = GoalDeleteInputSchema.safeParse({
        id: parseInt(opts.id as string, 10),
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await goalsDelete(input.data);
        if (opts.pretty) {
          console.log(`Goal ${result.id} deleted.`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });
}
