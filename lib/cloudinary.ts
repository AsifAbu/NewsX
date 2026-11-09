import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = { url: string; name: string } | { error: string };

// Magic-byte signatures for the raster formats we accept. file.type is
// client-supplied and trivially spoofable, so it's only a fast pre-check —
// this is the real gate. SVG is deliberately excluded (XML, no fixed magic
// bytes, and a known stored-XSS vector if ever served inline unsanitized).
function detectImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

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

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(bytes)) {
    return { error: "That file doesn't look like a valid JPEG, PNG, GIF, or WebP image." };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { error: "Image upload isn't configured yet (missing Cloudinary credentials)." };
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  try {
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
