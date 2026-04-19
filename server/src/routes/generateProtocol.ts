import { randomUUID } from "crypto";
import { Router, type Request, type Response } from "express";
import { validateGenerateBody } from "../services/validateGenerateBody.js";
import { generateHardwareProtocolWithGemini } from "../services/geminiProtocol.js";
import { synthesizeVoiceCoaching } from "../services/elevenLabsVoice.js";
import { persistAssessmentSession } from "../services/firebaseSession.js";

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

    const voice = await synthesizeVoiceCoaching(gemini.protocol);

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
