import { Box, Paper, Typography } from "@mui/material";

type Props = {
  points: number[];
};

export function ClientTrendChart({ points }: Props) {
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
        Recovery trend
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "end",
          gap: 1.2,
          height: 220,
          pt: 1,
        }}
      >
        {points.map((value, index) => (
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
                minHeight: 18,
                height: `${value}%`,
                borderRadius: "14px 14px 6px 6px",
                background: "linear-gradient(180deg, #A8BBA3, #B87C4C)",
              }}
            />
            <Typography sx={{ mt: 1, fontSize: 11, color: "#cbd5e1" }}>
              D{index + 1}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}