export type BodyZone = {
  area: string;
  intensity: number; // 0 to 1
};

export type BodySnapshot = {
  recoveryScore: number;
  zones: BodyZone[];
  recommendedPlacement: {
    sunPad: string;
    moonPad: string;
  };
  state: {
    hrv: number;
    strain: number;
    readiness: "low" | "stable" | "high";
  };
};

/** UI-friendly summary derived from API `hardwareProtocol`. */
export type HardwareProtocol = {
  duration: number;
  thermal: string;
  light: string;
  resonance: string;
  guidance: string[];
};

/** Subset of backend Hardware_Protocol used for mapping (see docs/hardware-protocol.schema.json). */
export type HardwareProtocolApi = {
  schemaVersion: string;
  sessionDurationMinutes: number;
  sequence: Array<{
    order: number;
    modality: string;
    intensity: number;
    durationMinutes: number;
    notes?: string;
  }>;
  sunPad: Record<string, unknown>;
  moonPad: Record<string, unknown>;
  photobiomodulation?: { redNm: number; blueNm: number };
};

export type GenerateProtocolResponse = {
  hardwareProtocol: HardwareProtocolApi;
  voiceAudio: {
    url: string;
    fallback: boolean;
    durationSeconds: number;
  };
  sessionId: string;
  validation: {
    source: "gemini" | "fallback";
    attempts: number;
    reason?: string;
  };
};

export type RecoveryEntry = {
  date: string;
  score: number;
  sessionIds: string[];
};

export type RecoveryListResponse = {
  userId: string;
  entries: RecoveryEntry[];
};

export type ClientSummary = {
  userId: string;
  displayName: string;
  lastRecoveryScore: number | null;
  scoreDate: string | null;
  mobilityStreakDays: number;
  level: number;
};

export type ClientsListResponse = {
  practitionerId: string;
  clients: ClientSummary[];
};

export function mapHardwareProtocolToPreview(
  p: HardwareProtocolApi,
): HardwareProtocol {
  const thermalStep = p.sequence.find(
    (s) => s.modality === "thermal" || s.modality === "combined",
  );
  const vibStep = p.sequence.find((s) => s.modality === "vibro_acoustic");
  const lightStep = p.sequence.find((s) => s.modality === "photobiomodulation");

  const guidance = p.sequence
    .map((s) => s.notes?.trim())
    .filter((n): n is string => Boolean(n));

  return {
    duration: p.sessionDurationMinutes,
    thermal: thermalStep
      ? `${thermalStep.modality} · ${thermalStep.intensity}%`
      : "thermal contrast",
    light: lightStep
      ? `photobiomodulation · ${lightStep.intensity}%`
      : "660nm / 450nm support",
    resonance: vibStep
      ? `vibro-acoustic · ${vibStep.intensity}%`
      : "low-frequency resonance",
    guidance:
      guidance.length > 0
        ? guidance
        : [
            "Inhale for 4 seconds.",
            "Exhale for 6 seconds.",
            "Relax the jaw and shoulders.",
          ],
  };
}
