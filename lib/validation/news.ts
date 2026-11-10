import { z } from "zod";
import { htmlToPlainText } from "@/lib/richtext";

export const newsSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  categoryIds: z.array(z.string()).min(1, "Select at least one category."),
  // body is already-sanitized HTML by the time it reaches here (see
  // lib/sanitize.ts) — length is checked on the visible text, not markup.
  body: z
    .string()
    .trim()
    .refine((val) => htmlToPlainText(val).length >= 20, "Body must be at least 20 characters."),
  imageUrl: z.url().optional().or(z.literal("")),
  sourceUrl: z.url().optional().or(z.literal("")),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "A rejection reason is required."),
});
