import { z } from "zod";

export const ContributionSchema = z.object({
  author: z.object({ name: z.string() }).nullable(),
});

export const BookSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string().nullable(),
  pages: z.number().nullable(),
  rating: z.number().nullable(),
  contributions: z.array(ContributionSchema).default([]),
});

export type Book = z.infer<typeof BookSchema>;

export const BooksByPkResponseSchema = z.object({
  books_by_pk: BookSchema.nullable(),
});

export const SearchResponseSchema = z.object({
  search: z.object({
    ids: z.array(z.number()),
    results: z.unknown(),
  }),
});

export const BookSearchInputSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  type: z.enum(["Book", "Author", "Series"]).default("Book"),
  limit: z.number().int().min(1).max(100).default(10),
});

export type BookSearchInput = z.infer<typeof BookSearchInputSchema>;

export const BookGetInputSchema = z.object({
  id: z.number().int().positive("Book ID must be a positive integer"),
});
