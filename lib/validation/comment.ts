import { z } from "zod";

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty.").max(2000, "Comment is too long."),
});
