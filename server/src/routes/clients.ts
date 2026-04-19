import { Router, type Request, type Response } from "express";
import {
  ensureFirebaseAdmin,
  getAdminDb,
  verifyIdTokenFromRequest,
} from "../services/firebaseAdmin.js";

export const clientsRouter = Router();

clientsRouter.get("/clients", async (_req: Request, res: Response) => {
  if (!ensureFirebaseAdmin()) {
    return res.json({ practitionerId: "", clients: [] });
  }

  const auth = await verifyIdTokenFromRequest(_req.headers.authorization);
  if (!auth) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Sign in to load your client list.",
    });
  }

  const db = getAdminDb();
  if (!db) {
    return res.json({ practitionerId: auth.uid, clients: [] });
  }

  try {
    const userSnap = await db.collection("users").doc(auth.uid).get();
    const data = userSnap.data() as
      | { role?: string; clientIds?: unknown }
      | undefined;
    if (data?.role !== "practitioner") {
      return res.status(403).json({
        error: "forbidden",
        message: "Practitioner role is required for this view.",
      });
    }

    const clientIds = Array.isArray(data.clientIds)
      ? data.clientIds.filter((id): id is string => typeof id === "string")
      : [];

    const clients = await Promise.all(
      clientIds.map(async (cid) => {
        const [userDoc, engagementSnap, recoverySnap] = await Promise.all([
          db.collection("users").doc(cid).get(),
          db.collection("engagement").doc(cid).get(),
          db.collection("recoveryScores").where("userId", "==", cid).get(),
        ]);

        const displayName =
          typeof userDoc.data()?.displayName === "string"
            ? (userDoc.data() as { displayName: string }).displayName
            : cid;

        const recoveryRows = recoverySnap.docs
          .map((d) => {
            const x = d.data() as { date?: unknown; score?: unknown };
            const date = typeof x.date === "string" ? x.date : "";
            const score = typeof x.score === "number" ? x.score : null;
            return { date, score };
          })
          .filter((r) => r.date.length > 0)
          .sort((a, b) => b.date.localeCompare(a.date));

        const latest = recoveryRows[0];
        const eng = engagementSnap.data() as
          | { mobilityStreakDays?: unknown; level?: unknown }
          | undefined;

        return {
          userId: cid,
          displayName,
          lastRecoveryScore: latest?.score ?? null,
          scoreDate: latest?.date ?? null,
          mobilityStreakDays:
            typeof eng?.mobilityStreakDays === "number" ? eng.mobilityStreakDays : 0,
          level: typeof eng?.level === "number" ? eng.level : 1,
        };
      }),
    );

    return res.json({ practitionerId: auth.uid, clients });
  } catch (e) {
    console.warn("[clients] query failed:", e instanceof Error ? e.message : e);
    return res.status(500).json({
      error: "internal_error",
      message: "Unable to load clients right now.",
    });
  }
});
