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
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../auth/useAuth";
import { getRecovery } from "../../api/recovery";
import { db } from "../../lib/firebase";
import type { RecoveryEntry } from "../../types/vivawav3";

type EngagementDoc = {
  mobilityStreakDays?: number;
  xpTotal?: number;
  level?: number;
  lastSessionDate?: string;
};

export function RecoveryDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);
  const [engagement, setEngagement] = useState<EngagementDoc | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecovery(user.uid)
      .then((res) => {
        if (!cancelled) setEntries(res.entries);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load recovery history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, "engagement", user.uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setEngagement(snap.data() as EngagementDoc);
        else setEngagement(null);
      },
      () => setEngagement(null),
    );
  }, [user?.uid]);

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Recovery Dashboard
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Signed in as: {user?.displayName ?? user?.email}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Streak (days)
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {engagement?.mobilityStreakDays ?? "—"}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Level / XP
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {engagement?.level != null ? `Lv ${engagement.level}` : "—"}
              {engagement?.xpTotal != null ? ` · ${engagement.xpTotal} XP` : ""}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Last session
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {engagement?.lastSessionDate ?? "—"}
            </Typography>
          </Paper>
        </Stack>

        {error ? (
          <Alert severity="warning">
            {error} Configure the API and Firebase Admin on the server to load history from
            Firestore.
          </Alert>
        ) : null}

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">Loading scores…</Typography>
          </Stack>
        ) : (
          <>
            <Typography fontWeight={700}>Daily recovery scores</Typography>
            {entries.length === 0 ? (
              <Typography color="text.secondary">
                No recovery scores yet. Complete sessions (or seed{" "}
                <Typography component="span" variant="body2" sx={{ fontFamily: "monospace" }}>
                  recoveryScores
                </Typography>{" "}
                in Firestore) to see trends here.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell>Sessions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">{row.score}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {row.sessionIds.join(", ") || "—"}
                      </TableCell>
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
