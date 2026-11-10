import { ImageResponse } from "next/og";

// Browser-tab icon: Next.js's file convention auto-wires this as the site
// favicon (no manual <link> needed) and auto-generates every size browsers
// request. A lone "X" read as an unrelated symbol out of context, so this
// is a two-letter "NX" monogram instead — dark "N" + accent-red "X",
// mirroring the navbar wordmark's own colors — unambiguously a brand mark.
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
          background: "#171717",
          borderRadius: 6,
          fontSize: 19,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        <span style={{ color: "#ffffff" }}>N</span>
        <span style={{ color: "#c81e1e" }}>X</span>
      </div>
    ),
    { ...size }
  );
}
