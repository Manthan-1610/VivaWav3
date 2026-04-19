import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ClientSummary } from "../../types/vivawav3";

type Props = {
  clients: ClientSummary[] | unknown;
};

function statusFromScore(score: number | null): "Ready" | "Recovering" | "Needs support" {
  if (score === null) return "Needs support";
  if (score >= 70) return "Ready";
  if (score >= 50) return "Recovering";
  return "Needs support";
}

export function ClientList({ clients }: Props) {
  const safeClients = Array.isArray(clients) ? (clients as ClientSummary[]) : [];

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
        Client roster
      </Typography>

      {safeClients.length === 0 ? (
        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
          No clients linked yet. Add client Firebase UIDs to your practitioner profile.
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {safeClients.map((client) => {
            const name = client.displayName ?? client.userId;
            const score = client.lastRecoveryScore;
            const status = statusFromScore(score);

            return (
              <Box
                key={client.userId}
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  backgroundColor: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(148, 163, 184, 0.12)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
                    {name}
                  </Typography>
                  <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.3 }}>
                    Score {score ?? "—"} · Streak {client.mobilityStreakDays}d · Lv {client.level}
                    {client.scoreDate ? ` · ${client.scoreDate}` : ""}
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={status}
                  sx={{
                    fontWeight: 700,
                    bgcolor:
                      status === "Ready"
                        ? "rgba(168,187,163,0.25)"
                        : status === "Recovering"
                        ? "rgba(184,124,76,0.25)"
                        : "rgba(239,68,68,0.15)",
                    color:
                      status === "Ready"
                        ? "#A8BBA3"
                        : status === "Recovering"
                        ? "#B87C4C"
                        : "#fca5a5",
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}