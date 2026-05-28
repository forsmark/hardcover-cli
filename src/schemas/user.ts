import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  books_count: z.number(),
  followers_count: z.number(),
  followed_users_count: z.number(),
  pro: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;

export const MeResponseSchema = z.object({
  me: z.array(UserSchema).min(1),
});
