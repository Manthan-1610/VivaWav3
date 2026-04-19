import { useEffect, useRef } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { BodyZone } from "../../types/vivawav3";
import { POSE_SEGMENT_PAIRS } from "../../lib/poseEstimator";

type Props = {
  zones: BodyZone[];
  /** Live landmarks from the most recent detected pose frame. */
  landmarks?: NormalizedLandmark[] | null;
  /** True while MediaPipe currently sees a full pose. */
  poseDetected?: boolean;
  /** True once analysis has run (either live preview or confirmed snapshot). */
  analysisComplete?: boolean;
};

// ─── Body silhouette zone geometry (SVG viewBox 0 0 120 240) ─────────────────
// These rectangles define the hit/heat region for each anatomical zone label.
const ZONE_REGIONS: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  shoulders: { x: 28, y: 42, w: 64, h: 22, label: "Shoulders" },
  hips:      { x: 36, y: 112, w: 48, h: 24, label: "Hips" },
  knees:     { x: 36, y: 152, w: 48, h: 22, label: "Knees" },
  ankles:    { x: 38, y: 198, w: 44, h: 20, label: "Ankles" },
};

// ─── Body silhouette paths (simplified anatomical shape) ─────────────────────
const HEAD_CX = 60, HEAD_CY = 22, HEAD_R = 16;
const BODY_PATH = "M 36 42 Q 28 54 30 70 L 28 112 Q 36 116 60 116 Q 84 116 92 112 L 90 70 Q 92 54 84 42 Z";
const LEFT_ARM  = "M 36 46 Q 20 64 18 98 Q 22 102 28 98 Q 30 70 42 56 Z";
const RIGHT_ARM = "M 84 46 Q 100 64 102 98 Q 98 102 92 98 Q 90 70 78 56 Z";
const LEFT_LEG  = "M 44 116 Q 36 148 34 200 Q 40 204 48 200 Q 48 150 54 116 Z";
const RIGHT_LEG = "M 76 116 Q 84 148 86 200 Q 80 204 72 200 Q 72 150 66 116 Z";

function intensityToColor(intensity: number): string {
  // 0 = cool green, 0.5 = amber, 1 = red
  if (intensity < 0.2) return "rgba(168,187,163,0.35)";
  if (intensity < 0.4) return "rgba(168,187,163,0.65)";
  if (intensity < 0.6) return "rgba(234,179,8,0.60)";
  if (intensity < 0.8) return "rgba(249,115,22,0.65)";
  return "rgba(239,68,68,0.75)";
}

function intensityToStroke(intensity: number): string {
  if (intensity < 0.2) return "rgba(168,187,163,0.8)";
  if (intensity < 0.5) return "rgba(234,179,8,0.8)";
  return "rgba(239,68,68,0.9)";
}

// ─── Skeleton canvas (mirrored to match camera preview) ───────────────────────
function SkeletonCanvas({ landmarks }: { landmarks: NormalizedLandmark[] | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 120, H = 240;
    ctx.clearRect(0, 0, W, H);
    if (!landmarks?.length) return;

    // Mirror X to match the mirrored camera preview
    const toX = (lx: number) => (1 - lx) * W;
    const toY = (ly: number) => ly * H;

    ctx.strokeStyle = "rgba(168,187,163,0.9)";
    ctx.lineWidth = 1.5;
    for (const [a, b] of POSE_SEGMENT_PAIRS) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      ctx.beginPath();
      ctx.moveTo(toX(la.x), toY(la.y));
      ctx.lineTo(toX(lb.x), toY(lb.y));
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(184,124,76,1)";
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(toX(lm.x), toY(lm.y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [landmarks]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={240}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

// ─── SVG body silhouette with heat-map zone coloring ────────────────────────────
function BodySilhouette({ zones }: { zones: BodyZone[] }) {
  const zoneMap = Object.fromEntries(zones.map((z) => [z.area, z.intensity]));

  const zoneRect = (key: string) => {
    const region = ZONE_REGIONS[key];
    if (!region) return null;
    const intensity = zoneMap[key] ?? 0;
    return (
      <rect
        key={key}
        x={region.x}
        y={region.y}
        width={region.w}
        height={region.h}
        rx={6}
        fill={intensityToColor(intensity)}
        stroke={intensityToStroke(intensity)}
        strokeWidth={intensity > 0.15 ? 1.5 : 0.5}
        style={{ transition: "fill 0.6s ease, stroke 0.6s ease" }}
      />
    );
  };

  return (
    <svg viewBox="0 0 120 240" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      {/* Body fill */}
      <path d={BODY_PATH} fill="rgba(30,41,59,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      <path d={LEFT_ARM}  fill="rgba(30,41,59,0.80)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      <path d={RIGHT_ARM} fill="rgba(30,41,59,0.80)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      <path d={LEFT_LEG}  fill="rgba(30,41,59,0.80)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      <path d={RIGHT_LEG} fill="rgba(30,41,59,0.80)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      {/* Head */}
      <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R}
        fill="rgba(30,41,59,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth={1} />

      {/* Heat-map zones */}
      {Object.keys(ZONE_REGIONS).map(zoneRect)}

      {/* Zone labels */}
      {Object.entries(ZONE_REGIONS).map(([key, region]) => {
        const intensity = zoneMap[key] ?? 0;
        if (intensity < 0.05) return null;
        return (
          <text
            key={`label-${key}`}
            x={region.x + region.w / 2}
            y={region.y + region.h / 2 + 4}
            textAnchor="middle"
            fontSize={7}
            fontWeight="bold"
            fill="rgba(255,255,255,0.9)"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {Math.round(intensity * 100)}%
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function PoseOverlay({
  zones,
  landmarks,
  poseDetected = false,
  analysisComplete = false,
}: Props) {
  const hasZones = zones.length > 0;

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
        color: "#e2e8f0",
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
          Body map
        </Typography>
        <Chip
          size="small"
          label={
            hasZones
              ? "Analysis complete"
              : poseDetected
              ? "Pose detected — recording…"
              : "Waiting for pose"
          }
          sx={{
            fontWeight: 700,
            bgcolor: hasZones
              ? "rgba(168,187,163,0.25)"
              : poseDetected
              ? "rgba(184,124,76,0.25)"
              : "rgba(148,163,184,0.15)",
            color: "#e2e8f0",
            fontSize: 11,
          }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        {/* ── Silhouette + skeleton ── */}
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: "100%", sm: 140 },
            maxWidth: 160,
            mx: "auto",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingBottom: "200%", // maintain 1:2 aspect ratio
              borderRadius: 3,
              bgcolor: "rgba(2,6,23,0.6)",
              border: "1px solid rgba(148,163,184,0.12)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", inset: 8 }}>
              {hasZones ? (
                <BodySilhouette zones={zones} />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "#475569", textAlign: "center" }}>
                    {poseDetected
                      ? "Stop recording to see body map"
                      : "Step into frame — full body visible"}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Skeleton overlay — always rendered when landmarks exist */}
            {landmarks?.length ? (
              <Box sx={{ position: "absolute", inset: 8 }}>
                <SkeletonCanvas landmarks={landmarks} />
              </Box>
            ) : null}
          </Box>
        </Box>

        {/* ── Zone intensity list ── */}
        <Box sx={{ flex: 1, width: "100%" }}>
          {!hasZones && !analysisComplete ? (
            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
              {poseDetected
                ? "Record movement, then stop to see asymmetry zones."
                : "Step into frame so shoulders and hips are visible. Start recording when pose is detected."}
            </Typography>
          ) : !hasZones && analysisComplete ? (
            <Typography sx={{ color: "#f59e0b", fontSize: 13 }}>
              No clear pose detected in the recording. Ensure the client faces the camera with full body visible and retry.
            </Typography>
          ) : (
            <Stack spacing={1}>
              <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
                Asymmetry zones
              </Typography>
              {zones.map((zone) => {
                const pct = Math.round(zone.intensity * 100);
                const severity =
                  pct >= 60 ? "High" : pct >= 30 ? "Moderate" : "Low";
                const color =
                  pct >= 60 ? "#f87171" : pct >= 30 ? "#fbbf24" : "#86efac";

                return (
                  <Box key={zone.area}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.4 }}>
                      <Typography sx={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>
                        {zone.area}
                      </Typography>
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
                        <Typography sx={{ fontSize: 11, color, fontWeight: 700 }}>
                          {severity}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
                          {pct}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        bgcolor: "rgba(30,41,59,0.8)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 999,
                          background:
                            pct >= 60
                              ? "linear-gradient(90deg, #f97316, #ef4444)"
                              : pct >= 30
                              ? "linear-gradient(90deg, #A8BBA3, #f59e0b)"
                              : "linear-gradient(90deg, #A8BBA3, #86efac)",
                          transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
