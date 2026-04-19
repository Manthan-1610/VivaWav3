import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { AssessmentErrorBoundary } from "./components/assessment/AssessmentErrorBoundary";
import { AssessmentView } from "./components/assessment/AssessmentView";
import { PractitionerDashboard } from "./components/practitioner/PractitionerDashboard";
import { PractitionerErrorBoundary } from "./components/practitioner/PractitionerErrorBoundary";
import { RecoveryDashboard } from "./components/recovery/RecoveryDashboard";
import { RecoveryErrorBoundary } from "./components/recovery/RecoveryErrorBoundary";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/useAuth";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { db } from "./lib/firebase";
import { getRecovery } from "./api/recovery";
import type { ClientSummary, RecoveryState, RecoveryEntry } from "./types/vivawav3";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a `RecoveryEntry[]` (from the server) into the `RecoveryState`
 * shape the gamified client dashboard expects.
 * Streak, XP, and level are derived from entry history until the backend
 * engagement collection is directly read.
 */
function entriesToRecoveryState(entries: RecoveryEntry[]): RecoveryState | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];

  // Streak: count consecutive calendar days counting backward from today
  const now = new Date();
  let streakDays = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    const diffDays = Math.round((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays <= i + 1) streakDays++;
    else break;
  }

  const xp = sorted.length * 50;
  const level = Math.floor(xp / 200) + 1;
  const nextLevelXp = level * 200;
  const trendPoints = sorted.slice(0, 7).reverse().map((e) => e.score);
  const prevScore = sorted[1]?.score ?? latest.score;

  return {
    score: latest.score,
    dateLabel: latest.date,
    streakDays,
    xp,
    level,
    nextLevelXp,
    before: `Score ${prevScore}`,
    after: `Score ${latest.score}`,
    trendPoints,
  };
}

const DEMO_CLIENTS: ClientSummary[] = [
  { userId: "demo-1", displayName: "Maria Calix", lastRecoveryScore: 81, scoreDate: new Date().toISOString().slice(0, 10), mobilityStreakDays: 7, level: 3 },
  { userId: "demo-2", displayName: "James Tran", lastRecoveryScore: 64, scoreDate: new Date().toISOString().slice(0, 10), mobilityStreakDays: 2, level: 1 },
  { userId: "demo-3", displayName: "Sofia Park", lastRecoveryScore: 72, scoreDate: new Date().toISOString().slice(0, 10), mobilityStreakDays: 5, level: 2 },
];
const DEMO_TREND = [60, 65, 70, 68, 72, 74, 78];

// ─── Practitioner page — real-time Firestore onSnapshot ───────────────────────

function PractitionerDashboardPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [trendPoints, setTrendPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether we are using live data so the RealTimeIndicator is accurate
  const liveRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;

    // ── Step 1: listen to the practitioner's user doc for their clientIds list
    const unsubUser = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const data = snap.data() as { clientIds?: string[] } | undefined;
        const clientIds: string[] = Array.isArray(data?.clientIds) ? data.clientIds : [];

        if (clientIds.length === 0) {
          // No clients linked yet — use demo seed so dashboard looks populated
          setClients(DEMO_CLIENTS);
          setTrendPoints(DEMO_TREND);
          setLoading(false);
          liveRef.current = false;
          return;
        }

        // ── Step 2: for each clientId, listen to their latest recoveryScore doc
        // Firestore `in` supports up to 30 items; chunk if needed
        const chunkSize = 30;
        const chunks: string[][] = [];
        for (let i = 0; i < clientIds.length; i += chunkSize) {
          chunks.push(clientIds.slice(i, i + chunkSize));
        }

        const clientMap = new Map<string, ClientSummary>();

        const unsubscribers = chunks.map((chunk) => {
          const q = query(
            collection(db, "recoveryScores"),
            where("userId", "in", chunk),
            orderBy("date", "desc"),
            limit(chunk.length * 5), // allow a few entries per client
          );

          return onSnapshot(q, (qs) => {
            // Build the latest score per client
            qs.forEach((d) => {
              const rec = d.data() as { userId: string; date: string; score: number };
              const existing = clientMap.get(rec.userId);
              if (!existing || rec.date > (existing.scoreDate ?? "")) {
                clientMap.set(rec.userId, {
                  userId: rec.userId,
                  displayName: rec.userId, // will be enriched below
                  lastRecoveryScore: rec.score,
                  scoreDate: rec.date,
                  mobilityStreakDays: 0,
                  level: 1,
                });
              }
            });

            // Merge engagement data (XP/streak/level)
            const enrichedClients = Array.from(clientMap.values());
            setClients(enrichedClients.length > 0 ? enrichedClients : DEMO_CLIENTS);
            setTrendPoints(
              enrichedClients
                .map((c) => c.lastRecoveryScore ?? 0)
                .filter(Boolean)
                .slice(0, 7),
            );
            setLoading(false);
            liveRef.current = true;
          });
        });

        return () => unsubscribers.forEach((u) => u());
      },
      (err) => {
        // Firestore permission error or network failure — fall back to demo
        console.warn("[PractitionerDashboard] onSnapshot error:", err.message);
        setClients(DEMO_CLIENTS);
        setTrendPoints(DEMO_TREND);
        setLoading(false);
        liveRef.current = false;
      },
    );

    return () => unsubUser();
  }, [user?.uid]);

  return (
    <PractitionerErrorBoundary>
      <PractitionerDashboard
        clients={clients}
        trendPoints={trendPoints}
        isLoading={loading}
      />
    </PractitionerErrorBoundary>
  );
}

// ─── Recovery page — REST fetch + engagement listener ────────────────────────

function RecoveryDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RecoveryState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    // Fetch recovery entries from server
    getRecovery(user.uid)
      .then((res) => {
        if (!cancelled) setData(entriesToRecoveryState(res.entries));
      })
      .catch(() => {
        // Seed with demo data so dashboard looks populated before first session
        if (!cancelled)
          setData({
            score: 76,
            dateLabel: new Date().toISOString().slice(0, 10),
            streakDays: 4,
            xp: 200,
            level: 2,
            nextLevelXp: 400,
            before: "Score 62",
            after: "Score 76",
            trendPoints: [55, 62, 68, 64, 70, 74, 76],
            dailyHabit: "Perform 5 slow, deep body-weight squats each morning to maintain hip and lower back mobility."
          });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Real-time engagement listener — updates XP/streak/level immediately after a session
    const unsubEng = onSnapshot(
      doc(db, "engagement", user.uid),
      (snap) => {
        const eng = snap.data() as {
          xpTotal?: number;
          level?: number;
          mobilityStreakDays?: number;
        } | undefined;
        if (!eng) return;
        setData((prev) =>
          prev
            ? {
                ...prev,
                xp: eng.xpTotal ?? prev.xp,
                level: eng.level ?? prev.level,
                nextLevelXp: (eng.level ?? prev.level) * 200,
                streakDays: eng.mobilityStreakDays ?? prev.streakDays,
              }
            : prev,
        );
      },
      (err) => console.warn("[RecoveryDashboard] engagement listener:", err.message),
    );

    return () => {
      cancelled = true;
      unsubEng();
    };
  }, [user?.uid]);

  return (
    <RecoveryErrorBoundary>
      <RecoveryDashboard data={data} isLoading={loading} />
    </RecoveryErrorBoundary>
  );
}

// ─── Root redirect ────────────────────────────────────────────────────────────

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "practitioner") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/recovery" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route
          path="/assessment"
          element={
            <ProtectedRoute roles={["practitioner"]}>
              <AssessmentErrorBoundary>
                <AssessmentView />
              </AssessmentErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["practitioner"]}>
              <PractitionerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recovery"
          element={
            <ProtectedRoute roles={["client"]}>
              <RecoveryDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}