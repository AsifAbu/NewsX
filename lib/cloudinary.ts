import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = { url: string; name: string } | { error: string };

// Shared by lib/actions/upload.ts (news images) and lib/actions/profile.ts
// (avatars) — same validation/upload logic, different Cloudinary folder and
// different caller-side authorization.
export async function uploadToCloudinary(file: File, folder: string): Promise<CloudinaryUploadResult> {
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
        { folder, resource_type: "image" },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        }
      );
      stream.end(bytes);
    });

    return { url: result.secure_url, name: file.name };
  } catch (err) {
    console.error("uploadToCloudinary failed:", err);
    return { error: "Upload failed. Try again." };
  }
}
