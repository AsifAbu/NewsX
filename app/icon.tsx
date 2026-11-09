import { ImageResponse } from "next/og";

// Browser-tab icon: Next.js's file convention auto-wires this as the site
// favicon (no manual <link> needed) and auto-generates every size browsers
// request. Echoes the navbar wordmark (News + accent-red "X") as a compact
// mark: a solid accent-red square with a bold white "X".
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c81e1e",
          borderRadius: 6,
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        X
      </div>
    ),
    { ...size }
  );
}
