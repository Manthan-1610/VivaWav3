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

/**
 * Multi-signal wellness score (0–100) combining:
 *   - Asymmetry score     50% weight  (higher asymmetry → lower score)
 *   - HRV signal          30% weight  (higher HRV → better score; range 20–100ms)
 *   - Strain signal       20% weight  (higher strain → lower score; range 0–21)
 * Deterministic: identical inputs → identical score (Requirement 8.4).
 */
function recoveryScore(
  asymmetry: Record<string, unknown>,
  wearables: Record<string, unknown>,
): number {
  // ── Asymmetry component (0–100, lower is better) ───────────────────────────
  const js = asymmetry.jointScores;
  let asymmetryScore = 72; // default if no joint data
  if (js && typeof js === "object" && !Array.isArray(js)) {
    let sum = 0;
    let n = 0;
    for (const v of Object.values(js as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) { sum += v; n++; }
    }
    if (n > 0) asymmetryScore = Math.max(0, Math.min(100, Math.round(100 - (sum / n) * 55)));
  }

  // ── HRV component (0–100) ───────────────────────────────────────────────────
  // Map HRV 20ms→0 to 100ms→100; clamp outside range.
  let hrvScore = 65; // default (neutral)
  if (typeof wearables.hrv === "number" && Number.isFinite(wearables.hrv) && wearables.hrv > 0) {
    hrvScore = Math.max(0, Math.min(100, Math.round(((wearables.hrv - 20) / 80) * 100)));
  }

  // ── Strain component (0–100, inverted: higher strain → lower score) ─────────
  // Map strain 0→100 to 21→0; clamp.
  let strainScore = 60; // default (moderate)
  if (typeof wearables.strain === "number" && Number.isFinite(wearables.strain) && wearables.strain >= 0) {
    strainScore = Math.max(0, Math.min(100, Math.round(100 - (wearables.strain / 21) * 100)));
  }

  // Weighted composite
  const composite = asymmetryScore * 0.5 + hrvScore * 0.3 + strainScore * 0.2;
  return Math.max(0, Math.min(100, Math.round(composite)));
}


export async function checkUserExists(email: string): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;
  try {
    // Query users collection for the provided email field
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    return !snap.empty;
  } catch (e) {
    console.warn("[firebase] checkUserExists error:", e);
    return false;
  }
}

export async function persistAssessmentSession(input: {
  sessionId: string;
  userId: string; // This could be email or UID
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

  const score = recoveryScore(input.asymmetry, input.wearables);
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
      { userId: input.userId, date, score, sessionIds },
      { merge: true },
    );
  });

  // ── Engagement: XP / streak / level ───────────────────────────────────────
  const XP_PER_SESSION = 50;
  await withFirestoreRetry("engagement write", async () => {
    const engRef = db.collection("engagement").doc(input.userId);
    const engSnap = await engRef.get();
    const eng = engSnap.data() as {
      xpTotal?: number;
      level?: number;
      mobilityStreakDays?: number;
      lastSessionDate?: string;
    } | undefined;

    const prevXp = typeof eng?.xpTotal === "number" ? eng.xpTotal : 0;
    const newXp = prevXp + XP_PER_SESSION;
    const newLevel = Math.floor(newXp / 200) + 1;

    const lastDate = typeof eng?.lastSessionDate === "string" ? eng.lastSessionDate : null;
    const prevStreak = typeof eng?.mobilityStreakDays === "number" ? eng.mobilityStreakDays : 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = 1;
    if (lastDate === date) {
      newStreak = prevStreak;
    } else if (lastDate === yesterdayStr) {
      newStreak = prevStreak + 1;
    }

    await engRef.set(
      { userId: input.userId, xpTotal: newXp, level: newLevel, mobilityStreakDays: newStreak, lastSessionDate: date },
      { merge: true },
    );
  });

  // ── Link Client to Practitioner ───────────────────────────────────────────
  if (input.practitionerId && input.userId) {
    await withFirestoreRetry("link client write", async () => {
      const pracRef = db.collection("users").doc(input.practitionerId);
      const pracSnap = await pracRef.get();
      if (pracSnap.exists) {
        const data = pracSnap.data() as { clientIds?: string[] } | undefined;
        const clientIds = Array.isArray(data?.clientIds) ? data!.clientIds : [];
        if (!clientIds.includes(input.userId)) {
          await pracRef.update({
            clientIds: FieldValue.arrayUnion(input.userId)
          });
        }
      }
    });
  }
}

