"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import { uploadToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";
import { interestedCategoriesSchema } from "@/lib/validation/user";

export type UploadAvatarResult = CloudinaryUploadResult;

// Any logged-in user may change their own avatar (unlike uploadImageAction,
// which is Moderator/Admin-only for news images) — gated by requireSession(),
// not requireRole(). The uploaded URL is saved straight to this user's own
// User.avatarUrl; there's no "whose avatar" input to trust.
export async function uploadAvatarAction(formData: FormData): Promise<UploadAvatarResult> {
  const session = await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file received." };
  }

  const result = await uploadToCloudinary(file, "newsx/avatars");
  if ("error" in result) return result;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: result.url },
  });

  revalidatePath("/profile");
  // The avatar also shows in the Navbar (UserMenu), which lives in the root
  // layout — a page-scoped revalidatePath above doesn't touch that, so the
  // navbar icon would keep showing the old avatar until a hard reload
  // without this. Revalidating the root layout refreshes it everywhere.
  revalidatePath("/", "layout");
  return result;
}

// Any logged-in user (Registered User, Moderator, Admin) may set which
// categories they're interested in — TC-RU-14. Unlike NewsForm's
// categoryIds (at least one required), an empty selection is valid here: it
// just means no Dashboard hero boost is applied.
export async function updateInterestedCategoriesAction(formData: FormData) {
  const session = await requireSession();

  const parsed = interestedCategoriesSchema.safeParse({
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success) {
    redirect(`/profile?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid selection.")}`);
  }

  // Cross-check against real category ids rather than trusting the
  // submitted values blindly (checkboxes are rendered from the real list,
  // but a request could still be tampered with).
  const validCategories = await prisma.category.findMany({
    where: { id: { in: parsed.data.categoryIds } },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { interestedCategoryIds: validCategories.map((c) => c.id) },
  });

  revalidatePath("/profile");
  // The Dashboard hero re-sort (app/(public)/page.tsx) reads this field too.
  revalidatePath("/", "layout");
  redirect("/profile");
}
