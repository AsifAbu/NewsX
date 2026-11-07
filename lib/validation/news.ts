import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  categoryId: z.string().min(1, "Category is required."),
  body: z.string().trim().min(20, "Body must be at least 20 characters."),
  imageUrl: z.url().optional().or(z.literal("")),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "A rejection reason is required."),
});
