import { GoogleGenerativeAI } from "@google/generative-ai";
import type { HardwareProtocol } from "./hardwareProtocolValidator.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type PadConfig = {
  placement?: string;
  placementDetail?: string;
  thermalMode?: string;
  vibroAcousticIntensity?: number;
  lightIntensity?: number;
};

export type SessionNarrationContext = {
  /** Top asymmetry zones from MediaPipe, e.g. ["shoulders", "hips"] */
  topZones?: string[];
  /** Client's recovery readiness signal */
  readiness?: "low" | "stable" | "high";
  /** Mock wearable HRV (if available) */
  hrv?: number | null;
  /** Mock wearable strain (if available) */
  strain?: number | null;
};

export type VoiceAudioResult = {
  url: string;
  fallback: boolean;
  durationSeconds: number;
  /** The generated narration script, for display in the UI */
  script?: string;
};

// ─── Gemini-powered narration script generation ───────────────────────────────

const NARRATION_SYSTEM_PROMPT = `You are a warm, professional wellness session narrator for Hydrawav3 — a hands-off recovery device using Polar Water Resonance (thermal modulation, photobiomodulation, and vibro-acoustic stimulation).

Your job: write a spoken narration script of 180–250 words that will be played as audio to the client at the START of their Hydrawav3 session.

Rules:
- Speak directly to the client ("You", "Your") in second person, warm and reassuring tone
- Reference the SPECIFIC body zones detected in their movement assessment
- Explain the SPECIFIC pad placements (Sun pad and Moon pad) by name and location  
- Walk through the session phases in order, briefly explaining what each modality does
- If HRV data is provided, reference it naturally (e.g. "Your recovery signals suggest...")
- End with a closing sentence empowering the client
- Use ONLY approved wellness terms: recovery, wellness, mobility, performance, supports, empowers, enhances
- NEVER use: medical device, clinical, diagnostic, treats, cures, diagnoses, heals, reduces inflammation, patient, disease
- Output ONLY the spoken narration text — no titles, no labels, no markdown. Just plain natural speech.`;

async function generateNarrationWithGemini(
  protocol: HardwareProtocol,
  context: SessionNarrationContext,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const sun = protocol.sunPad as PadConfig | undefined;
    const moon = protocol.moonPad as PadConfig | undefined;
    const sunPlace = (sun?.placement ?? "lower_back").replace(/_/g, " ");
    const moonPlace = (moon?.placement ?? "mid_back").replace(/_/g, " ");
    const sunMode = sun?.thermalMode === "heat" ? "warming" : sun?.thermalMode === "cool" ? "cooling" : "neutral";
    const moonMode = moon?.thermalMode === "cool" ? "cooling" : moon?.thermalMode === "heat" ? "warming" : "neutral";

    const seqSummary = Array.isArray(protocol.sequence)
      ? protocol.sequence
          .map((s: Record<string, unknown>) =>
            `Step ${s.order}: ${String(s.modality).replace(/_/g, " ")} for ${s.durationMinutes} min at intensity ${s.intensity}${s.notes ? ` — ${s.notes}` : ""}`,
          )
          .join("; ")
      : "9-minute balanced session";

    const contextInput = {
      sessionDurationMinutes: protocol.sessionDurationMinutes ?? 9,
      topAsymmetryZones: context.topZones ?? [],
      readiness: context.readiness ?? "stable",
      hrv: context.hrv,
      strain: context.strain,
      sunPad: { placement: sunPlace, thermalMode: sunMode },
      moonPad: { placement: moonPlace, thermalMode: moonMode },
      sessionSequence: seqSummary,
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
      systemInstruction: NARRATION_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(JSON.stringify(contextInput, null, 2));
    const text = result.response.text().trim();

    // Sanity check — must look like a paragraph, not JSON or an error
    if (text.length > 80 && !text.startsWith("{") && !text.startsWith("[")) {
      return text;
    }
    return null;
  } catch (e) {
    console.warn("[elevenLabs] Gemini narration generation failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ─── Template fallback script ─────────────────────────────────────────────────

function buildTemplateFallback(
  protocol: HardwareProtocol,
  context: SessionNarrationContext = {},
): string {
  const { topZones = [], readiness, hrv } = context;
  const totalMinutes =
    typeof protocol.sessionDurationMinutes === "number" ? protocol.sessionDurationMinutes : 9;
  const sun = protocol.sunPad as PadConfig | undefined;
  const moon = protocol.moonPad as PadConfig | undefined;
  const sunPlace = (sun?.placement ?? "lower_back").replace(/_/g, " ");
  const moonPlace = (moon?.placement ?? "mid_back").replace(/_/g, " ");

  const readinessLine =
    readiness === "low" || (hrv !== null && hrv !== undefined && hrv < 35)
      ? "Your body signals suggest you could benefit from deep recovery today — this session is calibrated to be gentle and restorative."
      : readiness === "high" || (hrv !== null && hrv !== undefined && hrv > 65)
      ? "Your recovery signals look strong — this session is tuned to maintain your momentum and support peak mobility."
      : "Your movement data shows balanced recovery needs — this session is personalized to support your stability and wellbeing.";

  const zoneLine =
    topZones.length > 0
      ? `Our movement assessment detected asymmetry in your ${topZones.slice(0, 2).join(" and ").replace(/_/g, " ")}. The pad placements and sequence are calibrated specifically for those areas.`
      : "Your pads are positioned based on your movement assessment today.";

  const phaseSummary = Array.isArray(protocol.sequence)
    ? protocol.sequence
        .slice(0, 3)
        .map((s: Record<string, unknown>) => {
          const name = String(s.modality ?? "").replace(/_/g, " ");
          return `${Math.round(Number(s.durationMinutes) || 3)} minutes of ${name}`;
        })
        .join(", then ")
    : `${totalMinutes} minutes of Polar Water Resonance`;

  return (
    `Welcome to your personalized Hydrawav3 session. ${readinessLine} ` +
    `${zoneLine} ` +
    `The Sun pad is on your ${sunPlace} with ${sun?.thermalMode ?? "heat"} thermal support. ` +
    `The Moon pad is on your ${moonPlace} with ${moon?.thermalMode ?? "cool"} contrast, ` +
    `creating Polar Water Resonance. ` +
    `Your ${totalMinutes}-minute session flows through: ${phaseSummary}. ` +
    `As the session begins, simply breathe naturally — inhale for four counts, exhale for six. ` +
    `Let the device do the work. Hydrawav3 empowers your body's natural recovery.`
  );
}

// ─── Main synthesizer ─────────────────────────────────────────────────────────

export async function synthesizeVoiceCoaching(
  protocol: HardwareProtocol,
  context: SessionNarrationContext = {},
): Promise<VoiceAudioResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "EXAVITQu4vr4xnSDxMaL"; // Sarah — warm, reassuring
  const fallbackUrl = process.env.VOICE_COACHING_FALLBACK_AUDIO_URL?.trim();

  const durationSeconds = Math.round(
    (typeof protocol.sessionDurationMinutes === "number"
      ? protocol.sessionDurationMinutes
      : 9) * 60,
  );

  // 1. Try Gemini to generate a fully dynamic, natural script
  // 2. Fall back to deterministic template if Gemini is unavailable
  const geminiScript = await generateNarrationWithGemini(protocol, context);
  const script = geminiScript ?? buildTemplateFallback(protocol, context);

  console.log(
    `[elevenLabs] narration source: ${geminiScript ? "gemini" : "template"} | chars: ${script.length}`,
  );

  if (!apiKey) {
    return { url: fallbackUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", fallback: true, durationSeconds, script };
  }

  try {
    // eleven_turbo_v2_5 is faster (~3x) than eleven_multilingual_v2 on free tier
    // 25s timeout gives synthesis time for a ~250-word script on turbo model
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_turbo_v2_5", // faster synthesis, lower latency
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.warn(`[elevenLabs] API error ${res.status}:`, errBody);
      throw new Error(`ElevenLabs HTTP ${res.status}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString("base64");
    console.log(`[elevenLabs] synthesized ${buf.byteLength} bytes of audio`);

    return { url: `data:audio/mpeg;base64,${b64}`, fallback: false, durationSeconds, script };
  } catch (e) {
    console.warn("[elevenLabs] synthesis failed, using fallback:", e instanceof Error ? e.message : e);
    return { url: fallbackUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", fallback: true, durationSeconds, script };
  }
}
