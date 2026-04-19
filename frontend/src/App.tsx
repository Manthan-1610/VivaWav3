import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { getSessions } from "./api/sessions";
import type {
  ClientSummary,
  RecoveryEntry,
  RecoveryState,
  SavedAssessmentSession,
} from "./types/vivawav3";

function sessionsToClients(sessions: SavedAssessmentSession[]): ClientSummary[] {
  const latestByClient = new Map<string, SavedAssessmentSession>();

  for (const session of [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (!latestByClient.has(session.clientId)) {
      latestByClient.set(session.clientId, session);
    }
  }

  return Array.from(latestByClient.values()).map((session) => ({
    userId: session.clientId,
    displayName: session.displayName,
    lastRecoveryScore: session.recoveryScore,
    scoreDate: session.scoreDate,
    mobilityStreakDays: session.mobilityStreakDays,
    level: session.level,
    status: session.status,
    lastSessionAt: session.createdAt,
    lastCheckInAt: session.createdAt,
  }));
}

function sessionsToRecoveryEntries(sessions: SavedAssessmentSession[]): RecoveryEntry[] {
  return [...sessions]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({
      date: s.scoreDate,
      score: s.recoveryScore,
      sessionIds: [s.sessionId],
    }));
}

function entriesToRecoveryState(
  entries: RecoveryEntry[],
  latestHabit?: string,
): RecoveryState | null {
  if (!entries.length) return null;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];

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
    dailyHabit: latestHabit,
    entries: sorted,
  };
}

import { getClients } from "./api/clients";

function PractitionerDashboardPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [trendPoints, setTrendPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    const load = () => {
      setLoading(true);
      Promise.all([
        getClients(),
        getSessions({ practitionerId: user.uid })
      ])
        .then(([clientRes, sessionRes]) => {
          if (cancelled) return;
          setClients(clientRes.clients);
          const sessions = sessionRes.sessions ?? [];
          setTrendPoints(
            [...sessions]
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((s) => s.recoveryScore)
              .slice(-10)
          );
        })
        .catch((err) => {
          console.warn("[PractitionerDashboard] load error:", err);
          if (!cancelled) {
            setClients([]);
            setTrendPoints([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    window.addEventListener("vivawav3:sessions-updated", load);
    return () => {
      cancelled = true;
      window.removeEventListener("vivawav3:sessions-updated", load);
    };
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

import { getEngagement } from "./api/engagement";

function RecoveryDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RecoveryState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [sessionRes, engData] = await Promise.all([
          getSessions({ clientId: user.uid }),
          getEngagement(user.uid).catch(() => ({ 
            userId: user.uid, xpTotal: 0, level: 1, streakDays: 0, lastSessionDate: null 
          }))
        ]);

        if (cancelled) return;
        const sessions = sessionRes.sessions ?? [];
        if (sessions.length === 0) {
          setData(null);
          return;
        }

        const latest = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        const latestHabit =
          latest && typeof (latest.protocol as any)?.dailyHabit === "string"
            ? String((latest.protocol as any).dailyHabit)
            : undefined;

        const state = entriesToRecoveryState(sessionsToRecoveryEntries(sessions), latestHabit);
        if (state) {
          state.xp = engData.xpTotal;
          state.level = engData.level;
          state.streakDays = engData.streakDays;
          state.nextLevelXp = engData.level * 200;
        }
        setData(state);
      } catch (err) {
        console.warn("[RecoveryDashboard] load error:", err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    window.addEventListener("vivawav3:sessions-updated", load);
    return () => {
      cancelled = true;
      window.removeEventListener("vivawav3:sessions-updated", load);
    };
  }, [user?.uid]);

  return (
    <RecoveryErrorBoundary>
      <RecoveryDashboard data={data} isLoading={loading} />
    </RecoveryErrorBoundary>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "practitioner") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/recovery" replace />;
}

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