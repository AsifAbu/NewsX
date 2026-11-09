import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.email("Please enter a valid email."),
    phone: z
      .string()
      .trim()
      .min(7, "Please enter a valid phone number.")
      .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-zA-Z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

// A user may have zero interests (no boost applied anywhere), so no .min() —
// unlike newsSchema.categoryIds, which requires at least one.
export const interestedCategoriesSchema = z.object({
  categoryIds: z.array(z.string()),
});
