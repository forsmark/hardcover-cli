import { z } from "zod";

export const STATUS_NAMES = ["want", "reading", "read", "paused", "dnf", "ignored"] as const;
export type StatusName = (typeof STATUS_NAMES)[number];

export const StatusNameEnum = z.enum(STATUS_NAMES);

export const STATUS_ID_MAP: Record<StatusName, number> = {
  want: 1,
  reading: 2,
  read: 3,
  paused: 4,
  dnf: 5,
  ignored: 6,
};

export const STATUS_NAME_MAP: Record<number, StatusName> = {
  1: "want",
  2: "reading",
  3: "read",
  4: "paused",
  5: "dnf",
  6: "ignored",
};

export const UserBookSchema = z.object({
  id: z.number(),
  status_id: z.number(),
  rating: z.number().nullable(),
  date_added: z.string().nullable(),
  book: z.object({
    id: z.number(),
    title: z.string(),
  }),
});

export type UserBook = z.infer<typeof UserBookSchema>;

export const LibraryListInputSchema = z.object({
  status: StatusNameEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const LibraryAddInputSchema = z.object({
  bookId: z.coerce.number().int().positive("Book ID must be a positive integer"),
  status: z.enum(["want", "reading", "read"]).default("want"),
});

export const LibraryUpdateInputSchema = z
  .object({
    id: z.coerce.number().int().positive("Library entry ID must be a positive integer"),
    status: StatusNameEnum.optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    review: z.string().optional(),
  })
  .refine((d) => d.status !== undefined || d.rating !== undefined || d.review !== undefined, {
    message: "At least one of --status, --rating, or --review must be provided",
  });

export const LibraryRemoveInputSchema = z.object({
  id: z.coerce.number().int().positive("Library entry ID must be a positive integer"),
});
