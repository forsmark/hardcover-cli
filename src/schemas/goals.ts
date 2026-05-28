import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const GoalSchema = z.object({
  id: z.number(),
  metric: z.string(),
  goal: z.number(),
  progress: z.number().nullable(),
  state: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string(),
});

export type Goal = z.infer<typeof GoalSchema>;

export const GoalCreateInputSchema = z.object({
  metric: z.enum(["books", "pages"]),
  target: z.coerce.number().int().positive("Target must be a positive integer"),
  start: z.string().regex(DATE_REGEX, "Start date must be YYYY-MM-DD"),
  end: z.string().regex(DATE_REGEX, "End date must be YYYY-MM-DD"),
});

export const GoalUpdateInputSchema = z.object({
  id: z.coerce.number().int().positive("Goal ID must be a positive integer"),
  target: z.coerce.number().int().positive("Target must be a positive integer").optional(),
}).refine((d) => d.target !== undefined, {
  message: "At least --target must be provided",
});

export const GoalDeleteInputSchema = z.object({
  id: z.coerce.number().int().positive("Goal ID must be a positive integer"),
});
