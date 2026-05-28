import { Command } from "commander";
import { gqlRequest } from "../api/client.js";
import { getToken, TokenError } from "../auth.js";
import { SEARCH_QUERY, BOOKS_BY_PK_QUERY } from "../api/queries.js";
import {
  BookSearchInputSchema,
  BookGetInputSchema,
  SearchResponseSchema,
  BooksByPkResponseSchema,
} from "../schemas/books.js";
import type { Book, BookSearchInput } from "../schemas/books.js";
import { handleCommandError } from "./auth.js";

const BOOKS_SEARCH_EXAMPLE = {
  ids: [12345, 67890],
  results: [
    { id: 12345, title: "Dune", document_type: "Book" },
    { id: 67890, title: "Dune Messiah", document_type: "Book" },
  ],
};

const BOOKS_GET_EXAMPLE: Book = {
  id: 12345,
  title: "Dune",
  subtitle: null,
  pages: 412,
  rating: 4.5,
  contributions: [{ author: { name: "Frank Herbert" } }],
};

export async function booksSearch(
  input: BookSearchInput
): Promise<{ ids: number[]; results: unknown }> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ search: { ids: number[]; results: unknown } }>(
    token,
    SEARCH_QUERY,
    { query: input.query, queryType: input.type, perPage: input.limit }
  );
  return SearchResponseSchema.parse(data).search;
}

export async function booksGet(input: { id: number }): Promise<Book | null> {
  const token = await getToken();
  if (!token) throw new TokenError();

  const data = await gqlRequest<{ books_by_pk: Book | null }>(token, BOOKS_BY_PK_QUERY, {
    id: input.id,
  });
  return BooksByPkResponseSchema.parse(data).books_by_pk;
}

export function registerBooksCommands(program: Command): void {
  const books = program.command("books").description("Book search and lookup");

  books
    .command("search")
    .description("Search for books, authors, or series")
    .requiredOption("--query <str>", "Search query")
    .option("--type <type>", "Query type: Book, Author, Series", "Book")
    .option("--limit <n>", "Number of results (max 100)", "10")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(BOOKS_SEARCH_EXAMPLE, null, 2));
        return;
      }
      const input = BookSearchInputSchema.safeParse({
        query: opts.query,
        type: opts.type,
        limit: opts.limit,
      });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await booksSearch(input.data);
        if (opts.pretty) {
          console.log(`Found ${result.ids.length} result(s) for "${opts.query}"`);
          console.log(JSON.stringify(result.results, null, 2));
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });

  books
    .command("get")
    .description("Get details for a book by ID")
    .requiredOption("--id <int>", "Book ID")
    .option("--example", "Show example output")
    .option("--pretty", "Human-readable output")
    .action(async (opts) => {
      if (opts.example) {
        console.log(JSON.stringify(BOOKS_GET_EXAMPLE, null, 2));
        return;
      }
      const input = BookGetInputSchema.safeParse({ id: parseInt(opts.id, 10) });
      if (!input.success) {
        console.error(input.error.issues[0]?.message ?? "Invalid input");
        process.exit(1);
      }
      try {
        const result = await booksGet(input.data);
        if (!result) {
          console.error(`Book with ID ${opts.id} not found.`);
          process.exit(2);
        }
        if (opts.pretty) {
          const authors = result.contributions
            .map((c) => c.author?.name)
            .filter(Boolean)
            .join(", ") || "Unknown";
          console.log(`${result.title}${result.subtitle ? `: ${result.subtitle}` : ""}`);
          console.log(`Author(s): ${authors}`);
          if (result.pages) console.log(`Pages: ${result.pages}`);
          if (result.rating) console.log(`Rating: ${result.rating}/5`);
        } else {
          console.log(JSON.stringify(result));
        }
      } catch (err) {
        handleCommandError(err);
      }
    });
}
