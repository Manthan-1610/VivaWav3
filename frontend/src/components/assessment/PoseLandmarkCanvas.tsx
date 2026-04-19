import { useEffect, useRef } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { POSE_SEGMENT_PAIRS } from "../../lib/poseEstimator";
import type { BodySnapshot } from "../../types/vivawav3";

function getZoneCenter(placement: string, landmarks: NormalizedLandmark[], w: number, h: number) {
  // Common MediaPipe Pose landmarks:
  // 11 = left shoulder, 12 = right shoulder
  // 23 = left hip, 24 = right hip
  // 25 = left knee, 26 = right knee
  // 27 = left ankle, 28 = right ankle

  const toX = (lx: number) => (1 - lx) * w;
  const toY = (ly: number) => ly * h;

  let pts: number[] = [];

  switch (placement) {
    case "upper_back":
    case "shoulders":
      pts = [11, 12];
      break;
    case "mid_back":
      pts = [11, 12, 23, 24]; // Center of torso
      break;
    case "lower_back":
    case "hips":
      pts = [23, 24];
      break;
    case "left_shoulder": pts = [11]; break;
    case "right_shoulder": pts = [12]; break;
    case "left_hip": pts = [23]; break;
    case "right_hip": pts = [24]; break;
    case "hamstrings_left": pts = [23, 25]; break;
    case "hamstrings_right": pts = [24, 26]; break;
    case "calves_left": pts = [25, 27]; break;
    case "calves_right": pts = [26, 28]; break;
    case "knees": pts = [25, 26]; break;
    default:
      pts = [11, 12, 23, 24]; // fallback to torso
  }

  let cx = 0;
  let cy = 0;
  let validPts = 0;

  for (const i of pts) {
    if (landmarks[i]) {
      cx += toX(landmarks[i].x);
      cy += toY(landmarks[i].y);
      validPts++;
    }
  }

  if (validPts === 0) return null;
  return { x: cx / validPts, y: cy / validPts };
}

export function PoseLandmarkCanvas({
  videoRef,
  landmarks,
  recommendedPlacement,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: NormalizedLandmark[] | null;
  recommendedPlacement?: BodySnapshot["recommendedPlacement"];
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

      if (landmarks && landmarks.length > 0) {
        const toX = (lx: number) => (1 - lx) * w;
        const toY = (ly: number) => ly * h;

        ctx.strokeStyle = "rgba(168, 187, 163, 0.4)";
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

        ctx.fillStyle = "rgba(184, 124, 76, 0.6)";
        for (const lm of landmarks) {
          ctx.beginPath();
          ctx.arc(toX(lm.x), toY(lm.y), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(video);
    return () => ro.disconnect();
  }, [videoRef, landmarks]);

  // If we have recommended placement, render glowing DOM elements so we can use CSS animations
  // since Canvas animations are harder to sync perfectly and DOM nodes support CSS keyframes natively.
  
  const sunPos = recommendedPlacement && landmarks ? getZoneCenter(recommendedPlacement.sunPad, landmarks, videoRef.current?.clientWidth || 0, videoRef.current?.clientHeight || 0) : null;
  const moonPos = recommendedPlacement && landmarks ? getZoneCenter(recommendedPlacement.moonPad, landmarks, videoRef.current?.clientWidth || 0, videoRef.current?.clientHeight || 0) : null;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {sunPos && (
        <div
          className="orb-sun"
          style={{
            position: "absolute",
            left: sunPos.x - 20,
            top: sunPos.y - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,77,109,0.9) 0%, rgba(255,77,109,0.3) 70%, transparent 100%)",
            boxShadow: "0 0 20px rgba(255,77,109,0.8)",
            zIndex: 10
          }}
        />
      )}
      {moonPos && (
        <div
          className="orb-moon"
          style={{
            position: "absolute",
            left: moonPos.x - 20,
            top: moonPos.y - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(72,202,228,0.9) 0%, rgba(72,202,228,0.3) 70%, transparent 100%)",
            boxShadow: "0 0 20px rgba(72,202,228,0.8)",
            zIndex: 10
          }}
        />
      )}
    </div>
  );
}
