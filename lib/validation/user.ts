import { z } from "zod";

// Shared by registerSchema (self-signup) and adminCreateUserSchema (Admin
// creating a User/Moderator/Admin account from the Users page) so the two
// don't drift on password/phone rules.
const userAccountFields = {
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
};

function passwordsMatch(data: { password: string; confirmPassword: string }) {
  return data.password === data.confirmPassword;
}
const passwordsMatchRefinement = {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
};

export const registerSchema = z.object(userAccountFields).refine(passwordsMatch, passwordsMatchRefinement);

// Admin-only: same account fields, plus the role to create the account with.
export const adminCreateUserSchema = z
  .object({
    ...userAccountFields,
    role: z.enum(["USER", "MODERATOR", "ADMIN"], "Please choose a user type."),
  })
  .refine(passwordsMatch, passwordsMatchRefinement);

export const loginSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

// A user may have zero interests (no boost applied anywhere), so no .min() —
// unlike newsSchema.categoryIds, which requires at least one.
export const interestedCategoriesSchema = z.object({
  categoryIds: z.array(z.string()),
});
