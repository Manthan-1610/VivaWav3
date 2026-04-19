export type BodyZone = {
  area: string;
  intensity: number;
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

export type HardwareProtocol = {
  duration: number;
  thermal: string;
  light: string;
  resonance: string;
  guidance: string[];
};

export type GenerateProtocolResponse = {
  hardwareProtocol: HardwareProtocol;
  sessionId: string;
  voiceAudio?: {
    url: string;
    durationSeconds: number;
    fallback?: boolean;
  };
  validation?: {
    source: "gemini" | "fallback";
    attempts: number;
    reason?: string;
  };
};

export type RecoveryState = {
  score: number;
  dateLabel: string;
  streakDays: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  before: string;
  after: string;
  trendPoints: number[];
};

export type ClientSummary = {
  name: string;
  score: number;
  streakDays: number;
  status: "Ready" | "Needs support" | "Recovering";
};

export type ClientsListResponse = ClientSummary[];

export type RecoveryListResponse = RecoveryState[];

export function mapHardwareProtocolToPreview(
  protocol: HardwareProtocol,
): HardwareProtocol {
  return protocol;
}