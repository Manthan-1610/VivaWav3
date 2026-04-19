import { Router, type Request, type Response } from "express";
import { listClientSummaries, listClientSummariesFromDb } from "../services/sessionStore.js";
import { verifyIdTokenFromRequest, getAdminDb } from "../services/firebaseAdmin.js";

export const clientsRouter = Router();

clientsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const auth = await verifyIdTokenFromRequest(req.headers.authorization);
    const practitionerId = auth?.uid || "unknown-practitioner";

    console.log(`[clients] Loading roster for practitioner: ${practitionerId}`);

    const localClients = listClientSummaries(practitionerId);
    let dbClients: any[] = [];
    
    try {
      dbClients = await listClientSummariesFromDb(practitionerId);
    } catch (dbErr) {
      console.error("[clients] listClientSummariesFromDb failed:", dbErr);
      // Continue with local clients if DB fails to avoid 500
    }

    // Merge and deduplicate by userId
    const merged = [...localClients];
    const seenIds = new Set(merged.map(c => c.userId));

    for (const c of dbClients) {
      if (!seenIds.has(c.userId)) {
        merged.push(c);
        seenIds.add(c.userId);
      }
    }

    return res.json({
      practitionerId,
      clients: merged,
    });
  } catch (e) {
    console.error("[clients] General error in /clients route:", e);
    return res.status(500).json({
      error: "internal_error",
      message: e instanceof Error ? e.message : "Unable to load clients right now.",
    });
  }
});

clientsRouter.get("/check/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const db = getAdminDb();
    if (!db) {
      console.warn("[clients] getAdminDb returned null during email check");
      return res.json({ exists: false });
    }
    
    // Query users collection for the provided email field
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    return res.json({ exists: !snap.empty });
  } catch (e) {
    console.error(`[clients] Email check failed for ${req.params.email}:`, e);
    return res.status(500).json({ exists: false, error: String(e) });
  }
});
