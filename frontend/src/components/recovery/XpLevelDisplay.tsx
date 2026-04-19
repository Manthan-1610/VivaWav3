import { LinearProgress, Paper, Stack, Typography } from "@mui/material";

type Props = {
  xp: number;
  level: number;
  nextLevelXp: number;
};

export function XpLevelDisplay({ xp, level, nextLevelXp }: Props) {
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

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
      <Stack spacing={1.1}>
        <Typography
          sx={{
            color: "#cbd5e1",
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          XP and level
        </Typography>

        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>
          Level {level} · {xp} XP
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "#1e293b",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              background: "linear-gradient(90deg, #A8BBA3, #B87C4C)",
            },
          }}
        />

        <Typography sx={{ color: "#cbd5e1", fontSize: 12 }}>
          {nextLevelXp - xp} XP to next level
        </Typography>
      </Stack>
    </Paper>
  );
}