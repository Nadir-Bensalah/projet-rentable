import { ImageResponse } from "next/og";

export const alt = "Relevéo — Vos relevés bancaires PDF en Excel, vérifiés au centime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0b1220 0%, #1e2e89 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#2547ea",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          R
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>Relevéo</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>Vos relevés bancaires PDF en Excel,</div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, color: "#6ee7b7", letterSpacing: -2 }}>vérifiés au centime.</div>
      </div>
      <div style={{ display: "flex", gap: 28, fontSize: 28, color: "#c7d2fe" }}>
        <span>Aucun fichier envoyé</span>
        <span>·</span>
        <span>Excel · CSV · OFX · écritures</span>
      </div>
    </div>,
    size,
  );
}
