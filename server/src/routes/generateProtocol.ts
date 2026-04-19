import { randomUUID } from "crypto";
import { Router, type Request, type Response } from "express";
import { validateGenerateBody } from "../services/validateGenerateBody.js";
import { generateHardwareProtocolWithGemini } from "../services/geminiProtocol.js";
import { synthesizeVoiceCoaching } from "../services/elevenLabsVoice.js";
import { persistAssessmentSession } from "../services/firebaseSession.js";
import { sendProtocolToDevice } from "../services/hydrawavDevice.js";

export const generateProtocolRouter = Router();

function wellnessMessage(details: string[]): string {
  if (details.length === 0) {
    return "Please review the request and try again.";
  }
  return "Some required information is missing. Please review the form and try again.";
}

async function handleGenerateProtocol(req: Request, res: Response) {
  try {
    const parsed = validateGenerateBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        error: "validation_error",
        message: wellnessMessage(parsed.details),
        details: parsed.details,
      });
    }

    const { userId, practitionerId, asymmetry, wearables, metadata } = parsed.data;
    const sessionId = `sess_${randomUUID().replace(/-/g, "")}`;

    const gemini = await generateHardwareProtocolWithGemini({
      userId,
      practitionerId,
      asymmetry,
      wearables,
      metadata,
    });

    // Build narration context from the real assessment data so the voice is personalized
    const topZones: string[] = [];
    const jointScores = (asymmetry.jointScores && typeof asymmetry.jointScores === "object" && !Array.isArray(asymmetry.jointScores))
      ? asymmetry.jointScores as Record<string, number>
      : {};
    // Sort zones by asymmetry score descending, take top 2
    const sorted = Object.entries(jointScores)
      .filter(([, v]) => typeof v === "number")
      .sort(([, a], [, b]) => (b as number) - (a as number));
    for (const [k] of sorted.slice(0, 2)) topZones.push(k);

    // Run voice synthesis + device dispatch in parallel for speed (both have independent timeouts)
    const [voice, device] = await Promise.all([
      synthesizeVoiceCoaching(gemini.protocol, {
        topZones,
        readiness: (asymmetry.readiness as "low" | "stable" | "high" | undefined) ?? undefined,
        hrv: typeof wearables.hrv === "number" ? wearables.hrv : null,
        strain: typeof wearables.strain === "number" ? wearables.strain : null,
      }),
      sendProtocolToDevice(gemini.protocol, sessionId),
    ]);

    await persistAssessmentSession({
      sessionId,
      userId,
      practitionerId,
      hardwareProtocol: gemini.protocol,
      wearables,
      asymmetry,
    });

    const validation =
      gemini.source === "gemini"
        ? { source: "gemini" as const, attempts: gemini.attempts }
        : {
            source: "fallback" as const,
            attempts: gemini.attempts,
            reason: gemini.reason,
          };

    return res.status(200).json({
      hardwareProtocol: gemini.protocol,
      voiceAudio: {
        url: voice.url,
        fallback: voice.fallback,
        durationSeconds: voice.durationSeconds,
        script: voice.script,
      },
      deviceSession: {
        live: device.live,
        topic: device.topic,
        status: device.status,
        message: device.message,
      },
      sessionId,
      validation,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "internal_error",
      message: "Something went wrong while preparing your session. Please try again shortly.",
    });
  }
}

generateProtocolRouter.post("/generate-protocol", handleGenerateProtocol);
generateProtocolRouter.post("/assessment", handleGenerateProtocol);
