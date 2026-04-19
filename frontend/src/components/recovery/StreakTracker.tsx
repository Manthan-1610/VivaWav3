import { Paper, Typography } from "@mui/material";

type Props = {
  streakDays: number;
};

export function StreakTracker({ streakDays }: Props) {
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
      <Typography
        sx={{
          color: "#cbd5e1",
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 800,
        }}
      >
        Mobility streak
      </Typography>

      <Typography
        sx={{
          mt: 0.75,
          fontSize: "2.2rem",
          lineHeight: 1,
          fontWeight: 900,
          color: "#f8fafc",
        }}
      >
        {streakDays} days
      </Typography>
    </Paper>
  );
}