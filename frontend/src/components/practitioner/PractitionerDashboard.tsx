import { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAuth } from "../../auth/useAuth";
import { getClients } from "../../api/clients";
import type { ClientSummary } from "../../types/vivawav3";

export function PractitionerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getClients()
      .then((res) => {
        if (!cancelled) setClients(res.clients);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load clients.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Practitioner Dashboard
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Signed in as: {user?.displayName ?? user?.email}
        </Typography>

        {error ? (
          <Alert severity="warning">
            {error} Ensure you are signed in, the server has Firebase Admin configured, and your
            user document has{" "}
            <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
              role: &quot;practitioner&quot;
            </Typography>{" "}
            with{" "}
            <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
              clientIds
            </Typography>{" "}
            populated.
          </Alert>
        ) : null}

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">Loading clients…</Typography>
          </Stack>
        ) : (
          <>
            <Typography fontWeight={700}>Linked clients</Typography>
            {clients.length === 0 ? (
              <Typography color="text.secondary">
                No clients linked yet. Add client Firebase UIDs to{" "}
                <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
                  users/{user?.uid ?? "…"}.clientIds
                </Typography>{" "}
                in Firestore (and ensure each client has{" "}
                <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
                  practitionerId
                </Typography>{" "}
                set).
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell align="right">Last score</TableCell>
                    <TableCell>Score date</TableCell>
                    <TableCell align="right">Streak</TableCell>
                    <TableCell align="right">Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.userId}>
                      <TableCell>{c.displayName}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{c.userId}</TableCell>
                      <TableCell align="right">
                        {c.lastRecoveryScore != null ? c.lastRecoveryScore : "—"}
                      </TableCell>
                      <TableCell>{c.scoreDate ?? "—"}</TableCell>
                      <TableCell align="right">{c.mobilityStreakDays}</TableCell>
                      <TableCell align="right">{c.level}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
