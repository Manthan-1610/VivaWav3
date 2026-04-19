import { useEffect, useRef } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { POSE_SEGMENT_PAIRS } from "../../lib/poseEstimator";

/**
 * Canvas aligned to the live video (Requirement 13 — landmark visualization on video).
 */
export function PoseLandmarkCanvas({
  videoRef,
  landmarks,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: NormalizedLandmark[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = video.clientWidth;
      const h = video.clientHeight;
      if (w < 2 || h < 2) return;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);
      if (!landmarks?.length) return;

      const toX = (lx: number) => (1 - lx) * w;
      const toY = (ly: number) => ly * h;

      ctx.strokeStyle = "rgba(168, 187, 163, 0.85)";
      ctx.lineWidth = 2;
      for (const [a, b] of POSE_SEGMENT_PAIRS) {
        const la = landmarks[a];
        const lb = landmarks[b];
        if (!la || !lb) continue;
        ctx.beginPath();
        ctx.moveTo(toX(la.x), toY(la.y));
        ctx.lineTo(toX(lb.x), toY(lb.y));
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(184, 124, 76, 0.95)";
      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(toX(lm.x), toY(lm.y), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(video);
    return () => ro.disconnect();
  }, [videoRef, landmarks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        maxHeight: 420,
        pointerEvents: "none",
      }}
    />
  );
}
