import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { PoseLandmarkCanvas } from "./PoseLandmarkCanvas";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraError: string | null;
  /** True once the user has clicked "Start camera" (stream may still be loading). */
  cameraStarted: boolean;
  countdown: number | null;
  onRetryCamera: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  maxSeconds: number;
  landmarks: NormalizedLandmark[] | null;
  onStartRecordingSequence: () => void;
  onStopRecording: () => void;
};

export function CameraCapture({
  videoRef,
  stream,
  cameraError,
  cameraStarted,
  countdown,
  onRetryCamera,
  isRecording,
  recordingSeconds,
  maxSeconds,
  landmarks,
  onStartRecordingSequence,
  onStopRecording,
}: Props) {
  const isLoading = cameraStarted && !stream && !cameraError;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
      }}
    >
      {/* ── Header ── */}
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
          Camera capture
        </Typography>

        <Chip
          label={
            isRecording
              ? `● Recording ${recordingSeconds}s / ${maxSeconds}s`
              : stream
              ? "Camera ready"
              : cameraError
              ? "Camera error"
              : isLoading
              ? "Starting…"
              : "Camera off"
          }
          sx={{
            bgcolor: isRecording
              ? "rgba(239,68,68,0.2)"
              : stream
              ? "rgba(168, 187, 163, 0.2)"
              : cameraError
              ? "rgba(239,68,68,0.15)"
              : "rgba(148,163,184,0.12)",
            color: isRecording ? "#fca5a5" : "#e2e8f0",
            fontWeight: 700,
            animation: isRecording ? "pulse 1.5s ease-in-out infinite" : undefined,
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.6 },
            },
          }}
        />
      </Stack>

      {/* ── Viewport ── */}
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
        }}
      >
        {/* Live video */}
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
          }}
        />

        {/* Skeleton canvas overlay */}
        {stream ? <PoseLandmarkCanvas videoRef={videoRef} landmarks={landmarks} /> : null}

        {/* Pre-camera start screen */}
        {!cameraStarted && !cameraError && (
          <Stack
            spacing={2.5}
            sx={{ alignItems: "center", px: 3, py: 4, textAlign: "center" }}
          >
            {/* Camera icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "2px solid rgba(168,187,163,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(168,187,163,0.08)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(168,187,163,0.85)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </Box>

            <Box>
              <Typography sx={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, mb: 0.5 }}>
                Camera is off
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 12, maxWidth: 280 }}>
                Click below to grant camera access. Your feed is processed locally — no video is uploaded or stored.
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={onStartRecordingSequence}
              sx={{
                py: 1.2,
                px: 4,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: 14,
                background: "linear-gradient(135deg, #A8BBA3, #B87C4C)",
                color: "#0b1220",
                boxShadow: "0 4px 20px rgba(168,187,163,0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #95a892, #a56d42)",
                  boxShadow: "0 6px 24px rgba(168,187,163,0.35)",
                },
              }}
            >
              Start recording
            </Button>
          </Stack>
        )}

        {/* Loading spinner while getUserMedia resolves */}
        {isLoading && (
          <Stack spacing={1.5} sx={{ alignItems: "center", px: 3 }}>
            <CircularProgress
              size={36}
              thickness={3}
              sx={{ color: "#A8BBA3" }}
            />
            <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
              Requesting camera access…
            </Typography>
          </Stack>
        )}

        {/* Camera error state */}
        {cameraError && (
          <Stack spacing={2} sx={{ alignItems: "center", px: 3, py: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "2px solid rgba(239,68,68,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(239,68,68,0.08)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="rgba(252,165,165,0.9)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </Box>
            <Box>
              <Typography sx={{ color: "#fca5a5", fontWeight: 700, fontSize: 14, mb: 0.5 }}>
                Camera unavailable
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 12, maxWidth: 280 }}>
                {cameraError}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={onRetryCamera}
              sx={{
                borderColor: "rgba(168,187,163,0.4)",
                color: "#A8BBA3",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": { borderColor: "#A8BBA3", bgcolor: "rgba(168,187,163,0.08)" },
              }}
            >
              Retry camera
            </Button>
          </Stack>
        )}

        {/* Live label */}
        {stream && (
          <Typography
            sx={{
              position: "absolute",
              bottom: 14,
              left: 14,
              px: 1,
              py: 0.5,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "#e2e8f0",
              fontSize: 12,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: 0.7,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#86efac",
                boxShadow: "0 0 6px #86efac",
                flexShrink: 0,
              }}
            />
            Live · wellness movement capture
          </Typography>
        )}
        {/* Countdown Overlay */}
        {countdown !== null && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.4)",
              zIndex: 10,
            }}
          >
            <Typography
              sx={{
                fontSize: 120,
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                animation: "popIn 1s ease-in-out infinite",
                "@keyframes popIn": {
                  "0%": { transform: "scale(0.5)", opacity: 0 },
                  "20%": { transform: "scale(1.1)", opacity: 1 },
                  "100%": { transform: "scale(1)", opacity: 0 },
                },
              }}
            >
              {countdown}
            </Typography>
          </Box>
        )}

      </Box>

      {/* ── Controls ── */}
      {stream && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!isRecording}
            onClick={onStopRecording}
            sx={{
              py: 1.3,
              borderRadius: 3,
              fontWeight: 800,
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              color: "#fff",
              opacity: isRecording ? 1 : 0.5,
              "&:hover": {
                background: "linear-gradient(135deg, #dc2626, #991b1b)",
              },
              "&.Mui-disabled": {
                background: "rgba(239,68,68,0.2)",
                color: "rgba(255,255,255,0.4)",
              }
            }}
          >
            ⏹ Stop recording
          </Button>
        </Stack>
      )}
    </Box>
  );
}
