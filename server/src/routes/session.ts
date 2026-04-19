import { Router, Request, Response } from "express";
import { listSessions, upsertSession, type SavedAssessmentSession } from "../services/sessionStore.js";

export const sessionRouter = Router();

sessionRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<SavedAssessmentSession>;

    if (
      !body.sessionId ||
      !body.practitionerId ||
      !body.clientId ||
      !body.clientEmail ||
      !body.displayName ||
      typeof body.recoveryScore !== "number" ||
      !body.scoreDate ||
      typeof body.mobilityStreakDays !== "number" ||
      typeof body.level !== "number" ||
      !body.status ||
      !body.bodySnapshot ||
      !body.protocol ||
      !body.createdAt
    ) {
      return res.status(400).json({
        ok: false,
        message: "Missing required session fields",
      });
    }

    const saved = upsertSession({
      sessionId: body.sessionId,
      practitionerId: body.practitionerId,
      clientId: body.clientId,
      clientEmail: body.clientEmail,
      displayName: body.displayName,
      recoveryScore: body.recoveryScore,
      scoreDate: body.scoreDate,
      mobilityStreakDays: body.mobilityStreakDays,
      level: body.level,
      status: body.status,
      bodySnapshot: body.bodySnapshot,
      protocol: body.protocol,
      voiceAudio: body.voiceAudio ?? null,
      validation: body.validation ?? null,
      deviceSession: body.deviceSession ?? null,
      createdAt: body.createdAt,
    });

    return res.json({ ok: true, session: saved });
  } catch (error) {
    console.error("Error saving session:", error);
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to save session",
    });
  }
});

sessionRouter.get("/", async (req: Request, res: Response) => {
  try {
    const practitionerId =
      typeof req.query.practitionerId === "string" ? req.query.practitionerId : undefined;
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;

    return res.json({
      practitionerId,
      clientId,
      sessions: listSessions({ practitionerId, clientId }),
    });
  } catch (error) {
    console.error("Error listing sessions:", error);
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Failed to list sessions",
    });
  }
});