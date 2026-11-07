"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "@/lib/require-role";

export type UploadResult = { url: string; name: string } | { error: string };

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireRole(["MODERATOR", "ADMIN"]);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file received." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Image must be under 10MB." };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { error: "Image upload isn't configured yet (missing Cloudinary credentials)." };
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "newsx", resource_type: "image" },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        }
      );
      stream.end(bytes);
    });

    return { url: result.secure_url, name: file.name };
  } catch (err) {
    console.error("uploadImageAction failed:", err);
    return { error: "Upload failed. Try again." };
  }
}
