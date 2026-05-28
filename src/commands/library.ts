import { Command } from "commander";
import { gqlRequest } from "../api/client.js";
import { getToken, TokenError } from "../auth.js";
import {
  buildLibraryListQuery,
  INSERT_USER_BOOK_MUTATION,
  buildUpdateUserBookMutation,
  DELETE_USER_BOOK_MUTATION,
} from "../api/queries.js";
import {
  LibraryListInputSchema,
  LibraryAddInputSchema,
  LibraryUpdateInputSchema,
  LibraryRemoveInputSchema,
  STATUS_ID_MAP,
  STATUS_NAME_MAP,
  UserBookSchema,
} from "../schemas/library.js";
import type { StatusName } from "../schemas/library.js";
import { z } from "zod";
import { handleCommandError } from "./auth.js";

interface LibraryEntry {
  id: number;
  status: StatusName;
  rating: number | null;
  date_added: string | null;
  book: { id: number; title: string };
}

const LIBRARY_LIST_EXAMPLE: LibraryEntry[] = [
  { id: 101, status: "reading", rating: null, date_added: "2026-01-15", book: { id: 12345, title: "Dune" } },
  { id: 102, status: "read", rating: 4.5, date_added: "2025-12-01", book: { id: 67890, title: "Dune Messiah" } },
];

const LIBRARY_ADD_EXAMPLE = { success: true, id: 103 };
const LIBRARY_UPDATE_EXAMPLE = { success: true, id: 101 };
const LIBRARY_REMOVE_EXAMPLE = { success: true, id: 101 };

export async function libraryList(input: {
  status?: StatusName;
  limit: number;
}): Promise<LibraryEntry[]> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const statusId = input.status !== undefined ? STATUS_ID_MAP[input.status] : undefined;
  const query = buildLibraryListQuery(statusId);
  const data = await gqlRequest<{ me: { id: number; user_books: unknown[] }[] }>(
    token,
    query,
    { limit: input.limit }
  );

  const userBooks = z.array(UserBookSchema).parse(data.me[0]?.user_books ?? []);
  return userBooks.map((ub) => ({
    id: ub.id,
    status: STATUS_NAME_MAP[ub.status_id] ?? "want",
    rating: ub.rating,
    date_added: ub.date_added,
    book: ub.book,
  }));
}

export async function libraryAdd(input: {
  bookId: number;
  status: "want" | "reading" | "read";
}): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ insert_user_book: { id: number; user_book: { id: number } } }>(
    token,
    INSERT_USER_BOOK_MUTATION,
    { bookId: input.bookId, statusId: STATUS_ID_MAP[input.status] }
  );
  return { success: true, id: data.insert_user_book.user_book.id };
}

export async function libraryUpdate(input: {
  id: number;
  status?: StatusName;
  rating?: number;
  review?: string;
}): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const fields: { statusId?: number; rating?: number; review?: string } = {};
  if (input.status !== undefined) fields.statusId = STATUS_ID_MAP[input.status];
  if (input.rating !== undefined) fields.rating = input.rating;
  if (input.review !== undefined) fields.review = input.review;

  const mutation = buildUpdateUserBookMutation(fields);
  const variables: Record<string, unknown> = { id: input.id };
  if (fields.statusId !== undefined) variables["statusId"] = fields.statusId;
  if (fields.rating !== undefined) variables["rating"] = fields.rating;
  if (fields.review !== undefined) variables["review"] = fields.review;

  await gqlRequest(token, mutation, variables);
  return { success: true, id: input.id };
}

export async function libraryRemove(input: { id: number }): Promise<{ success: boolean; id: number }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  await gqlRequest(token, DELETE_USER_BOOK_MUTATION, { id: input.id });
  return { success: true, id: input.id };
}

export function registerLibraryCommands(program: Command): void {
  const library = program.command("library").description("Manage your reading library");

  library
    .command("list")
    .description("List books in your library")
    .option("--status <status>", "Filter by status: want, reading, read, paused, dnf, ignored")
    .option("--limit <n>", "Number of results (max 100)", "20")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(LIBRARY_LIST_EXAMPLE, null, 2));
        return;
      }
      const input = LibraryListInputSchema.safeParse({
        status: opts.status,
        limit: parseInt(opts.limit as string, 10),
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await libraryList(input.data);
        if (opts.pretty) {
          if (!result.length) { console.log("No books found."); return; }
          for (const entry of result) {
            const rating = entry.rating != null ? ` (${entry.rating}/5)` : "";
            console.log(`[${entry.status.toUpperCase()}] ${entry.book.title}${rating} — ID: ${entry.id}`);
          }
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  library
    .command("add")
    .description("Add a book to your library")
    .requiredOption("--book-id <int>", "Book ID to add")
    .option("--status <status>", "Initial status: want, reading, read", "want")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(LIBRARY_ADD_EXAMPLE, null, 2));
        return;
      }
      const input = LibraryAddInputSchema.safeParse({
        bookId: parseInt(opts.bookId as string, 10),
        status: opts.status,
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await libraryAdd(input.data);
        if (opts.pretty) {
          console.log(`Book added to library (entry ID: ${result.id})`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  library
    .command("update")
    .description("Update a library entry's status, rating, or review")
    .requiredOption("--id <int>", "Library entry ID")
    .option("--status <status>", "New status: want, reading, read, paused, dnf, ignored")
    .option("--rating <n>", "Rating (0–5, multiples of 0.5)")
    .option("--review <str>", "Review text")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(LIBRARY_UPDATE_EXAMPLE, null, 2));
        return;
      }
      const input = LibraryUpdateInputSchema.safeParse({
        id: parseInt(opts.id as string, 10),
        status: opts.status,
        rating: opts.rating !== undefined ? parseFloat(opts.rating as string) : undefined,
        review: opts.review,
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await libraryUpdate(input.data);
        if (opts.pretty) {
          console.log(`Library entry ${result.id} updated.`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  library
    .command("remove")
    .description("Remove a book from your library")
    .requiredOption("--id <int>", "Library entry ID")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(LIBRARY_REMOVE_EXAMPLE, null, 2));
        return;
      }
      const input = LibraryRemoveInputSchema.safeParse({
        id: parseInt(opts.id as string, 10),
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await libraryRemove(input.data);
        if (opts.pretty) {
          console.log(`Library entry ${result.id} removed.`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });
}
