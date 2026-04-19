import type { HardwareProtocol } from "./hardwareProtocolValidator.js";

export function buildBreathingScript(protocol: HardwareProtocol): string {
  const minutes =
    typeof protocol.sessionDurationMinutes === "number"
      ? protocol.sessionDurationMinutes
      : 9;
  const lines: string[] = [
    `This guided breathing supports your recovery session for about ${minutes} minutes.`,
    "Inhale gently for four counts.",
    "Exhale slowly for six counts.",
    "Relax your jaw and shoulders.",
    "Continue at a pace that feels comfortable and supportive.",
  ];
  const seq = protocol.sequence;
  if (Array.isArray(seq)) {
    for (const step of seq) {
      if (step && typeof step === "object" && "notes" in step && typeof (step as { notes?: string }).notes === "string") {
        const n = (step as { notes: string }).notes.trim();
        if (n) lines.push(n);
      }
    }
  }
  return lines.join(" ");
}

export type VoiceAudioResult = {
  url: string;
  fallback: boolean;
  durationSeconds: number;
};

export async function synthesizeVoiceCoaching(
  protocol: HardwareProtocol,
): Promise<VoiceAudioResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM";
  const fallbackUrl = process.env.VOICE_COACHING_FALLBACK_AUDIO_URL?.trim();

  const durationSeconds = Math.round(
    (typeof protocol.sessionDurationMinutes === "number"
      ? protocol.sessionDurationMinutes
      : 9) * 60,
  );

  const text = buildBreathingScript(protocol);

  if (!apiKey) {
    return {
      url:
        fallbackUrl ||
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      fallback: true,
      durationSeconds,
    };
  }

  try {
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
          text,
          model_id: "eleven_multilingual_v2",
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`ElevenLabs HTTP ${res.status}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString("base64");
    return {
      url: `data:audio/mpeg;base64,${b64}`,
      fallback: false,
      durationSeconds,
    };
  } catch {
    return {
      url:
        fallbackUrl ||
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      fallback: true,
      durationSeconds,
    };
  }
}
