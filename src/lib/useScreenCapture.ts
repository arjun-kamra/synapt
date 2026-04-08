import { useEffect, useRef, useCallback, useState } from "react";

const CAPTURE_INTERVAL_MS = 45_000;  // analyze every 45 seconds
const CANVAS_WIDTH = 640;            // resize before sending to reduce cost
const CANVAS_HEIGHT = 400;
const JPEG_QUALITY = 0.6;

export type ScreenAnalysis = {
  focused: boolean;
  confidence: number;
  reason: string;
};

interface UseScreenCaptureOptions {
  active: boolean;
  onAnalysis: (result: ScreenAnalysis) => void;
}

export function useScreenCapture({ active, onAnalysis }: UseScreenCaptureOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"idle" | "active" | "denied" | "unsupported">("idle");
  const [lastAnalysis, setLastAnalysis] = useState<ScreenAnalysis | null>(null);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw current video frame to canvas (resized)
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Convert to base64 JPEG
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1];

    try {
      const res = await fetch("/api/analyze-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) return;
      const result: ScreenAnalysis = await res.json();
      setLastAnalysis(result);
      onAnalysis(result);
    } catch {
      // Silently fail — don't disrupt session
    }
  }, [onAnalysis]);

  const startCapture = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus("unsupported");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },  // 1fps — we only need occasional frames
        audio: false,
      });

      streamRef.current = stream;

      // Create hidden video element to hold the stream
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      videoRef.current = video;

      // Create offscreen canvas for frame capture
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      canvasRef.current = canvas;

      // If user stops sharing manually, clean up
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setStatus("idle");
        stopCapture();
      });

      setStatus("active");
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCapture = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!active) {
      stopCapture();
      return;
    }

    // Start polling once stream is active
    if (status === "active") {
      // Run first analysis after 10s, then every 45s
      const firstTimeout = setTimeout(() => {
        captureAndAnalyze();
        intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS);
      }, 10_000);

      return () => {
        clearTimeout(firstTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [active, status, captureAndAnalyze, stopCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCapture();
  }, [stopCapture]);

  return { status, lastAnalysis, startCapture, stopCapture };
}
