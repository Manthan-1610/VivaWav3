import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_SYSTEM_PROMPT } from "./geminiSystemPrompt.js";
import {
  isValidHardwareProtocol,
  validationErrors,
  type HardwareProtocol,
} from "./hardwareProtocolValidator.js";
import { FALLBACK_HARDWARE_PROTOCOL } from "./fallbackProtocol.js";

function extractJsonFromModelText(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  if (fence) return fence[1].trim();
  return trimmed;
}

function parseHardwareProtocol(text: string): HardwareProtocol | null {
  try {
    const raw = extractJsonFromModelText(text);
    const parsed: unknown = JSON.parse(raw);
    if (isValidHardwareProtocol(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export type GeminiProtocolResult =
  | { ok: true; protocol: HardwareProtocol; attempts: number; source: "gemini" }
  | {
      ok: true;
      protocol: HardwareProtocol;
      attempts: number;
      source: "fallback";
      reason: string;
    };

export async function generateHardwareProtocolWithGemini(
  userPayload: Record<string, unknown>,
): Promise<GeminiProtocolResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  if (!apiKey) {
    return {
      ok: true,
      protocol: FALLBACK_HARDWARE_PROTOCOL as HardwareProtocol,
      attempts: 0,
      source: "fallback",
      reason: "GEMINI_API_KEY not set",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: GEMINI_SYSTEM_PROMPT,
  });

  const userText = JSON.stringify(
    {
      task: "generate_hardware_protocol",
      ...userPayload,
      context: { averageSessionMinutesTarget: 9 },
    },
    null,
    2,
  );

  const maxAttempts = 3;
  let lastReason = "Could not parse valid protocol JSON";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(userText);
      const text = result.response.text();
      const parsed = parseHardwareProtocol(text);
      if (parsed) {
        return { ok: true, protocol: parsed, attempts: attempt, source: "gemini" };
      }
      try {
        const raw = extractJsonFromModelText(text);
        const maybe: unknown = JSON.parse(raw);
        lastReason = validationErrors(maybe).join("; ") || lastReason;
      } catch {
        lastReason = "Model response was not valid JSON";
      }
    } catch (e) {
      lastReason = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    ok: true,
    protocol: FALLBACK_HARDWARE_PROTOCOL as HardwareProtocol,
    attempts: maxAttempts,
    source: "fallback",
    reason: lastReason,
  };
}
