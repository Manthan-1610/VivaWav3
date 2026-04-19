export type SessionStatus = "Ready" | "Recovering" | "New" | "Needs Attention";

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

const sessions: SavedAssessmentSession[] = [];

export function upsertSession(session: SavedAssessmentSession): SavedAssessmentSession {
  const index = sessions.findIndex((s) => s.sessionId === session.sessionId);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
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

export function listClientSummaries(practitionerId?: string): ClientSummary[] {
  const records = listSessions(practitionerId ? { practitionerId } : undefined);
  const byClient = new Map<string, SavedAssessmentSession>();

  for (const record of records) {
    if (!byClient.has(record.clientId)) {
      byClient.set(record.clientId, record);
    }
  }

  return Array.from(byClient.values()).map((record) => ({
    userId: record.clientId,
    displayName: record.displayName,
    clientEmail: record.clientEmail,
    lastRecoveryScore: record.recoveryScore,
    scoreDate: record.scoreDate,
    mobilityStreakDays: record.mobilityStreakDays,
    level: record.level,
    status: record.status,
    lastSessionAt: record.createdAt,
    lastCheckInAt: record.createdAt,
  }));
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