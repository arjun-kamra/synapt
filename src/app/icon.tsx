import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#080806",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Center dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#EF9F27",
            position: "absolute",
          }}
        />
        {/* Top satellite */}
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#FAC775",
            position: "absolute",
            top: 2,
            left: 14,
          }}
        />
        {/* Bottom-right satellite */}
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#FAC775",
            position: "absolute",
            bottom: 2,
            right: 2,
          }}
        />
        {/* Bottom-left satellite */}
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#FAC775",
            position: "absolute",
            bottom: 2,
            left: 2,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
