import { Router, type Request, type Response } from "express";
import {
  ensureFirebaseAdmin,
  getAdminDb,
  verifyIdTokenFromRequest,
} from "../services/firebaseAdmin.js";

export const recoveryRouter = Router();

async function canReadRecovery(
  requesterUid: string,
  targetUserId: string,
): Promise<boolean> {
  if (requesterUid === targetUserId) return true;
  const db = getAdminDb();
  if (!db) return false;
  const [practitionerSnap, clientSnap] = await Promise.all([
    db.collection("users").doc(requesterUid).get(),
    db.collection("users").doc(targetUserId).get(),
  ]);
  const practitionerData = practitionerSnap.data() as
    | { role?: string; clientIds?: unknown }
    | undefined;
  if (practitionerData?.role === "practitioner") {
    const clientIds = Array.isArray(practitionerData.clientIds)
      ? practitionerData.clientIds.filter((id): id is string => typeof id === "string")
      : [];
    if (clientIds.includes(targetUserId)) return true;
  }
  const clientData = clientSnap.data() as { practitionerId?: string } | undefined;
  if (clientData?.practitionerId === requesterUid) return true;
  return false;
}

recoveryRouter.get("/recovery/:userId", async (req: Request, res: Response) => {
  const userId = req.params.userId?.trim();
  if (!userId) {
    return res.status(400).json({
      error: "validation_error",
      message: "A valid user id is required.",
    });
  }

  if (!ensureFirebaseAdmin()) {
    return res.json({ userId, entries: [] });
  }

  const auth = await verifyIdTokenFromRequest(req.headers.authorization);
  if (!auth) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Sign in to view recovery history.",
    });
  }

  const allowed = await canReadRecovery(auth.uid, userId);
  if (!allowed) {
    return res.status(403).json({
      error: "forbidden",
      message: "You do not have access to this recovery data.",
    });
  }

  const db = getAdminDb();
  if (!db) {
    return res.json({ userId, entries: [] });
  }

  try {
    const snap = await db.collection("recoveryScores").where("userId", "==", userId).get();
    const entries = snap.docs
      .map((d) => {
        const x = d.data() as {
          date?: unknown;
          score?: unknown;
          sessionIds?: unknown;
        };
        const date = typeof x.date === "string" ? x.date : "";
        const score = typeof x.score === "number" ? x.score : 0;
        const sessionIds = Array.isArray(x.sessionIds)
          ? x.sessionIds.filter((id): id is string => typeof id === "string")
          : [];
        return { date, score, sessionIds };
      })
      .filter((e) => e.date.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    return res.json({ userId, entries });
  } catch (e) {
    console.warn("[recovery] query failed:", e instanceof Error ? e.message : e);
    return res.status(500).json({
      error: "internal_error",
      message: "Unable to load recovery scores right now.",
    });
  }
});
