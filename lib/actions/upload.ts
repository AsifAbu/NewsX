"use server";

import { requireRole } from "@/lib/require-role";
import { uploadToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";

export type UploadResult = CloudinaryUploadResult;

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireRole(["MODERATOR", "ADMIN"]);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file received." };
  }

  return uploadToCloudinary(file, "newsx");
}
