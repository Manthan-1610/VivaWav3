import { FieldValue } from "firebase-admin/firestore";
import type { HardwareProtocol } from "./hardwareProtocolValidator.js";
import { getAdminDb } from "./firebaseAdmin.js";

async function withFirestoreRetry(label: string, fn: () => Promise<unknown>): Promise<void> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return;
    } catch (e) {
      console.warn(
        `[firebase] ${label} attempt ${attempt}/${maxAttempts}:`,
        e instanceof Error ? e.message : e,
      );
      if (attempt === maxAttempts) return;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
}

/** Deterministic 0–100 wellness score from asymmetry payload (Requirement 8.2 / 8.4). */
function recoveryScoreFromAsymmetry(asymmetry: Record<string, unknown>): number {
  const js = asymmetry.jointScores;
  if (!js || typeof js !== "object" || Array.isArray(js)) return 72;
  let sum = 0;
  let n = 0;
  for (const v of Object.values(js as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      sum += v;
      n += 1;
    }
  }
  const avg = n > 0 ? sum / n : 0.35;
  return Math.max(0, Math.min(100, Math.round(100 - avg * 55)));
}

export async function persistAssessmentSession(input: {
  sessionId: string;
  userId: string;
  practitionerId: string;
  hardwareProtocol: HardwareProtocol;
  wearables: Record<string, unknown>;
  asymmetry: Record<string, unknown>;
}): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const durationSeconds =
    typeof input.hardwareProtocol.sessionDurationMinutes === "number"
      ? Math.round(input.hardwareProtocol.sessionDurationMinutes * 60)
      : 540;

  await withFirestoreRetry("session write", () =>
    db.collection("sessions").doc(input.sessionId).set({
      userId: input.userId,
      practitionerId: input.practitionerId,
      startedAt: FieldValue.serverTimestamp(),
      asymmetrySummary: input.asymmetry,
      wearables: input.wearables,
      hardwareProtocol: input.hardwareProtocol,
      durationSeconds,
    }),
  );

  const score = recoveryScoreFromAsymmetry(input.asymmetry);
  const date = new Date().toISOString().slice(0, 10);
  const recoveryDocId = `${input.userId}_${date}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  await withFirestoreRetry("recovery score write", async () => {
    const ref = db.collection("recoveryScores").doc(recoveryDocId);
    const snap = await ref.get();
    const prev = snap.data() as { sessionIds?: unknown; score?: unknown } | undefined;
    const sessionIds = Array.isArray(prev?.sessionIds)
      ? [...(prev.sessionIds as string[]), input.sessionId]
      : [input.sessionId];
    await ref.set(
      {
        userId: input.userId,
        date,
        score,
        sessionIds,
      },
      { merge: true },
    );
  });
}
