import { Box, Button, Chip, Stack, Typography } from "@mui/material";

type Props = {
  isRecording: boolean;
  onToggleRecording: () => void;
};

export function CameraCapture({ isRecording, onToggleRecording }: Props) {
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
          label={isRecording ? "Recording" : "Idle"}
          sx={{
            bgcolor: isRecording
              ? "rgba(184, 124, 76, 0.2)"
              : "rgba(168, 187, 163, 0.2)",
            color: "#e2e8f0",
            fontWeight: 700,
          }}
        />
      </Stack>

      <Box
        sx={{
          height: 260,
          borderRadius: 3,
          bgcolor: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: 130,
            height: 230,
            borderRadius: "999px",
            border: "2px solid #A8BBA3",
            opacity: 0.9,
          }}
        />

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
          }}
        >
          Camera preview
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={onToggleRecording}
        sx={{
          mt: 2,
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
    </Box>
  );
}