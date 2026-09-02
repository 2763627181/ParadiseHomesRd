import { ImageResponse } from "next/og";
import { SITE } from "@paradise/config";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#163A2B",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", color: "#F4F8F5" }}>
          <span style={{ fontSize: 40, fontWeight: 700 }}>Paradise</span>
          <span style={{ fontSize: 40, fontWeight: 400, marginLeft: 12, opacity: 0.7 }}>Homes</span>
          <span style={{ fontSize: 22, fontWeight: 700, marginLeft: 8, color: "#B8935E" }}>RD</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "#F4F8F5" }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
            Encuentra tu lugar en
            <br />
            República Dominicana.
          </div>
          <div style={{ fontSize: 28, marginTop: 24, color: "rgba(244,248,245,0.7)" }}>
            Propiedades verificadas para comprar, alquilar o invertir.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
