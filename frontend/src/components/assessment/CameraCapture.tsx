import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { PoseLandmarkCanvas } from "./PoseLandmarkCanvas";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraError: string | null;
  onRetryCamera: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  maxSeconds: number;
  landmarks: NormalizedLandmark[] | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export function CameraCapture({
  videoRef,
  stream,
  cameraError,
  onRetryCamera,
  isRecording,
  recordingSeconds,
  maxSeconds,
  landmarks,
  onStartRecording,
  onStopRecording,
}: Props) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
          Camera capture
        </Typography>

        <Chip
          label={
            isRecording
              ? `Recording ${recordingSeconds}s / ${maxSeconds}s`
              : "Ready"
          }
          sx={{
            bgcolor: isRecording
              ? "rgba(184, 124, 76, 0.2)"
              : "rgba(168, 187, 163, 0.2)",
            color: "#e2e8f0",
            fontWeight: 700,
          }}
        />
      </Stack>

      {cameraError ? (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: "#fecaca", fontSize: 14, mb: 1 }}>
            {cameraError}
          </Typography>
          <Button variant="outlined" color="inherit" size="small" onClick={onRetryCamera}>
            Retry camera
          </Button>
        </Box>
      ) : null}

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

        {stream ? <PoseLandmarkCanvas videoRef={videoRef} landmarks={landmarks} /> : null}

        {!stream ? (
          <Typography sx={{ color: "#94a3b8", p: 3 }}>
            Starting camera… Allow access when your browser asks.
          </Typography>
        ) : null}

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
          }}
        >
          Live preview · wellness movement capture
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={!stream || Boolean(cameraError)}
          onClick={isRecording ? onStopRecording : onStartRecording}
          sx={{
            py: 1.3,
            borderRadius: 3,
            fontWeight: 800,
            background: "linear-gradient(135deg, #A8BBA3, #B87C4C)",
            color: "#0b1220",
            "&:hover": {
              background: "linear-gradient(135deg, #95a892, #a56d42)",
            },
          }}
        >
          {isRecording ? "Stop recording" : "Start recording"}
        </Button>
      </Stack>
    </Box>
  );
}
