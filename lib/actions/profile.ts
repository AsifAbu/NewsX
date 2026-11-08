"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-role";
import { uploadToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";

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
