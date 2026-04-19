import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ClientSummary } from "../../types/vivawav3";

type Props = {
  clients: ClientSummary[] | unknown;
};

export function ClientList({ clients }: Props) {
  const safeClients = Array.isArray(clients) ? clients : [];

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
        Client list
      </Typography>

      {safeClients.length === 0 ? (
        <Typography sx={{ color: "#cbd5e1" }}>
          No client data yet.
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {safeClients.map((client) => (
            <Box
              key={client.name}
              sx={{
                p: 1.6,
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
                  {client.name}
                </Typography>
                <Typography sx={{ color: "#cbd5e1", fontSize: 12, mt: 0.4 }}>
                  Score {client.score} · Streak {client.streakDays}d
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontWeight: 800,
                  color:
                    client.status === "Ready"
                      ? "#c7d8c2"
                      : client.status === "Recovering"
                      ? "#f0c7a8"
                      : "#f2d3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {client.status}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}