import { Box, Paper, Typography } from "@mui/material";

type Props = {
  points: number[];
};

export function RecoveryTrendChart({ points }: Props) {
  const safePoints = points.slice(-7); // Last 7 sessions

  return (
    <Paper
      sx={{
        p: 2.2,
        borderRadius: 4,
        backgroundColor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
        color: "#e2e8f0",
      }}
    >
      <Typography sx={{ color: "#f8fafc", fontWeight: 800, mb: 1.5 }}>
        Recovery Progress
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "end",
          gap: 1.2,
          height: 140,
          pt: 1,
        }}
      >
        {safePoints.length === 0 ? (
          <Typography sx={{ color: "#64748b", fontSize: 13, mb: 2 }}>
            Continue assessments to see your recovery trend.
          </Typography>
        ) : (
          safePoints.map((value, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                display: "grid",
                justifyItems: "center",
                alignItems: "end",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  minHeight: 12,
                  height: `${value}%`,
                  borderRadius: "10px 10px 4px 4px",
                  background: "linear-gradient(180deg, #A8BBA3, #B87C4C)",
                  opacity: index === safePoints.length - 1 ? 1 : 0.6,
                }}
              />
              <Typography sx={{ mt: 0.8, fontSize: 10, color: "#94a3b8" }}>
                S{index + 1}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}
