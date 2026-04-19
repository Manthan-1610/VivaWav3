import { Box, Paper, Stack, Typography } from "@mui/material";
import type { RecoveryEntry } from "../../types/vivawav3";

type Props = {
  entries: RecoveryEntry[];
};

export function RecoveryTimeline({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

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
        Recovery Journey
      </Typography>

      {sorted.length === 0 ? (
        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
          No session history yet. Complete your first assessment to start your journey!
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {sorted.map((entry, i) => (
            <Box
              key={`${entry.date}-${i}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1.5,
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: entry.score >= 70 ? "rgba(168,187,163,0.2)" : "rgba(184,124,76,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontWeight: 900, color: entry.score >= 70 ? "#A8BBA3" : "#B87C4C" }}>
                  {entry.score}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
                <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                  {entry.score >= 70 ? "Peak Readiness" : "Recovery in Progress"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
