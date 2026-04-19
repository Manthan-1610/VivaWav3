export type SessionStatus = "Ready" | "Recovering" | "New" | "Needs Attention";
import { getAdminDb } from "./firebaseAdmin.js";

export type SavedAssessmentSession = {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  clientEmail: string;
  displayName: string;
  recoveryScore: number;
  scoreDate: string;
  mobilityStreakDays: number;
  level: number;
  status: SessionStatus;
  bodySnapshot: unknown;
  protocol: unknown;
  voiceAudio?: unknown | null;
  validation?: unknown | null;
  deviceSession?: unknown | null;
  createdAt: string;
};

export type ClientSummary = {
  userId: string;
  displayName: string;
  clientEmail?: string | null;
  lastRecoveryScore: number | null;
  scoreDate: string | null;
  mobilityStreakDays: number;
  level: number;
  status: SessionStatus;
  lastSessionAt?: string | null;
  lastCheckInAt?: string | null;
};

export type RecoveryEntry = {
  date: string;
  score: number;
  sessionIds: string[];
};

export type EngagementData = {
  userId: string;
  xpTotal: number;
  level: number;
  streakDays: number;
  lastSessionDate: string | null;
};

// ─── Stores ───────────────────────────────────────────────────────────────────

const sessions: SavedAssessmentSession[] = [];
const engagementMap = new Map<string, EngagementData>();

// ─── Session Logic ────────────────────────────────────────────────────────────

// Helper to bridge Firestore data into our store format
export async function fetchSessionsFromDb(filter: {
  practitionerId?: string;
  clientId?: string;
}): Promise<SavedAssessmentSession[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    let query: any = db.collection("sessions");
    if (filter.practitionerId) {
      query = query.where("practitionerId", "==", filter.practitionerId);
    }
    if (filter.clientId) {
      query = query.where("userId", "==", filter.clientId);
    }

    // Index-free: fetch and sort in memory
    const snap = await query.get();
    return snap.docs.map(doc => {
      const data = doc.data();
      const dateStr = data.startedAt?.toDate ? data.startedAt.toDate().toISOString() : new Date().toISOString();
      return {
        sessionId: doc.id,
        practitionerId: data.practitionerId,
        clientId: data.userId,
        clientEmail: data.userId, 
        displayName: data.userId,
        recoveryScore: (data.asymmetrySummary?.recoveryScore as number) ?? 0,
        scoreDate: dateStr.slice(0, 10),
        mobilityStreakDays: 1, 
        level: 1,
        status: "Recovering",
        bodySnapshot: {
          recoveryScore: (data.asymmetrySummary?.recoveryScore as number) ?? 0,
          zones: [],
          recommendedPlacement: { sunPad: "lower_back", moonPad: "hips" },
          state: {
            hrv: (data.wearables?.hrv as number) ?? 0,
            strain: (data.wearables?.strain as number) ?? 0,
            readiness: (data.asymmetrySummary?.readiness as any) ?? "stable",
          }
        },
        protocol: data.hardwareProtocol,
        createdAt: dateStr,
      } as SavedAssessmentSession;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (e) {
    console.warn("[sessionStore] fetchSessionsFromDb error:", e);
    return [];
  }
}

export function upsertSession(session: SavedAssessmentSession): SavedAssessmentSession {
  const index = sessions.findIndex((s) => s.sessionId === session.sessionId);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  refreshEngagement(session.clientId);
  return session;
}

export function listSessions(filter?: {
  practitionerId?: string;
  clientId?: string;
}): SavedAssessmentSession[] {
  let filtered = [...sessions];

  if (filter?.practitionerId) {
    filtered = filtered.filter((s) => s.practitionerId === filter.practitionerId);
  }

  if (filter?.clientId) {
    filtered = filtered.filter((s) => s.clientId === filter.clientId);
  }

  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listClientSummariesFromDb(practitionerId: string): Promise<ClientSummary[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const pracSnap = await db.collection("users").doc(practitionerId).get();
    const data = pracSnap.data() as { clientIds?: string[] } | undefined;
    const clientIds = Array.isArray(data?.clientIds) ? data!.clientIds : [];

    const summaries = await Promise.all(
      clientIds.map(async (cid) => {
        try {
          const [engSnap, recoverySnap] = await Promise.all([
            db.collection("engagement").doc(cid).get(),
            db.collection("recoveryScores").where("userId", "==", cid).get(),
          ]);

          const eng = engSnap.data();
          // Map mobilityStreakDays from Firestore (was inconsistency)
          const streak = typeof eng?.mobilityStreakDays === "number" ? eng.mobilityStreakDays : 0;
          const level = typeof eng?.level === "number" ? eng.level : 1;

          // Index-free sort for latest score
          const scores = recoverySnap.docs.map(d => d.data() as { score?: number; date?: string });
          scores.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const latest = scores[0];

          return {
            userId: cid,
            displayName: cid,
            lastRecoveryScore: latest?.score ?? null,
            scoreDate: latest?.date ?? null,
            mobilityStreakDays: streak,
            level: level,
            status: "Ready" as SessionStatus,
          };
        } catch (innerErr) {
          console.warn(`[sessionStore] Failed to load client ${cid}:`, innerErr);
          return null;
        }
      })
    );
    return summaries.filter((s): s is ClientSummary => s !== null);
  } catch (e) {
    console.warn("[sessionStore] listClientSummariesFromDb error:", e);
    return [];
  }
}

// ─── Engagement Logic ─────────────────────────────────────────────────────────

export function getEngagement(userId: string): EngagementData {
  if (engagementMap.has(userId)) {
    return engagementMap.get(userId)!;
  }

  const clientSessions = listSessions({ clientId: userId }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let xpTotal = clientSessions.length * 50;
  let level = Math.floor(xpTotal / 200) + 1;
  let streakDays = clientSessions.length; // Submission-based as requested
  let lastSessionDate: string | null = null;

  if (clientSessions.length > 0) {
    const sorted = [...clientSessions].sort((a, b) => b.scoreDate.localeCompare(a.scoreDate));
    lastSessionDate = sorted[0].scoreDate;
  }

  const data = { userId, xpTotal, level, streakDays, lastSessionDate };
  engagementMap.set(userId, data);
  return data;
}

export function refreshEngagement(userId: string): EngagementData {
  engagementMap.delete(userId);
  return getEngagement(userId);
}

// ─── Summaries ────────────────────────────────────────────────────────────────

export function listClientSummaries(practitionerId?: string): ClientSummary[] {
  const records = listSessions(practitionerId ? { practitionerId } : undefined);
  const byClient = new Map<string, SavedAssessmentSession>();

  for (const record of records) {
    if (!byClient.has(record.clientId)) {
      byClient.set(record.clientId, record);
    }
  }

  return Array.from(byClient.values()).map((record) => {
    const engagement = getEngagement(record.clientId);
    return {
      userId: record.clientId,
      displayName: record.displayName,
      clientEmail: record.clientEmail,
      lastRecoveryScore: record.recoveryScore,
      scoreDate: record.scoreDate,
      mobilityStreakDays: engagement.streakDays,
      level: engagement.level,
      status: record.status,
      lastSessionAt: record.createdAt,
      lastCheckInAt: record.createdAt,
    };
  });
}

export function listRecoveryEntries(userId: string): RecoveryEntry[] {
  return listSessions({ clientId: userId })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({
      date: s.scoreDate,
      score: s.recoveryScore,
      sessionIds: [s.sessionId],
    }));
}