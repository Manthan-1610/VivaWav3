import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { PoseLandmarkCanvas } from "./PoseLandmarkCanvas";
import type { BodySnapshot } from "../../types/vivawav3";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraError: string | null;
  cameraStarted: boolean;
  onRetryCamera: () => void;
  landmarks: NormalizedLandmark[] | null;
  onStartCamera: () => void;
  onCaptureSnapshot: () => void;
  isAnalyzing: boolean;
  recommendedPlacement?: BodySnapshot["recommendedPlacement"];
};

export function CameraCapture({
  videoRef,
  stream,
  cameraError,
  cameraStarted,
  onRetryCamera,
  landmarks,
  onStartCamera,
  onCaptureSnapshot,
  isAnalyzing,
  recommendedPlacement
}: Props) {
  const isLoading = cameraStarted && !stream && !cameraError;
  const poseDetected = Boolean(landmarks && landmarks.length > 0);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
          Live Movement Capture
        </Typography>

        <Chip
          label={
            isAnalyzing
              ? "Analyzing Snapshot..."
              : stream
              ? poseDetected ? "Pose Detected - Ready" : "Waiting for pose"
              : cameraError
              ? "Camera error"
              : isLoading
              ? "Starting…"
              : "Camera off"
          }
          sx={{
            bgcolor: isAnalyzing
              ? "rgba(72,202,228,0.2)"
              : stream && poseDetected
              ? "rgba(34,197,94,0.2)"
              : "rgba(148,163,184,0.12)",
            color: isAnalyzing ? "#90E0EF" : stream && poseDetected ? "#86efac" : "#e2e8f0",
            fontWeight: 700,
          }}
        />
      </Stack>

      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          bgcolor: "#020617",
          overflow: "hidden",
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)"
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            maxHeight: 420,
            objectFit: "cover",
            transform: "scaleX(-1)",
            display: stream ? "block" : "none",
            opacity: isAnalyzing ? 0.5 : 1,
            transition: "opacity 0.3s ease"
          }}
        />

        {stream ? <PoseLandmarkCanvas videoRef={videoRef} landmarks={landmarks} recommendedPlacement={recommendedPlacement} /> : null}

        {!cameraStarted && !cameraError && (
          <Stack spacing={2.5} sx={{ alignItems: "center", px: 3, py: 4, textAlign: "center" }}>
            <Box>
              <Typography sx={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, mb: 0.5 }}>
                Camera is off
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 12, maxWidth: 280 }}>
                Click below to grant camera access. Processing runs locally.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={onStartCamera}
              sx={{
                py: 1.2, px: 4, borderRadius: 3, fontWeight: 800, fontSize: 14,
                background: "linear-gradient(135deg, #FF4D6D, #C9184A)", color: "#fff",
                boxShadow: "0 4px 20px rgba(255,77,109,0.3)",
                "&:hover": { background: "linear-gradient(135deg, #FF758F, #FF4D6D)" }
              }}
            >
              Start Camera
            </Button>
          </Stack>
        )}

        {isLoading && (
          <Stack spacing={1.5} sx={{ alignItems: "center", px: 3 }}>
            <CircularProgress size={36} thickness={3} sx={{ color: "#48CAE4" }} />
          </Stack>
        )}

        {cameraError && (
          <Stack spacing={2} sx={{ alignItems: "center", px: 3, py: 4, textAlign: "center" }}>
            <Typography sx={{ color: "#fca5a5", fontWeight: 700, fontSize: 14 }}>Camera unavailable</Typography>
            <Button variant="outlined" size="small" onClick={onRetryCamera}>Retry</Button>
          </Stack>
        )}
      </Box>

      {stream && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!poseDetected || isAnalyzing}
            onClick={onCaptureSnapshot}
            sx={{
              py: 1.5,
              borderRadius: 3,
              fontWeight: 800,
              background: "linear-gradient(135deg, #48CAE4, #0077B6)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(72,202,228,0.3)",
              transition: "all 0.2s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 25px rgba(72,202,228,0.5)" },
              "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }
            }}
          >
            {isAnalyzing ? "Analyzing Snapshot..." : "📸 Capture Snapshot"}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
