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

// ─── Hardware Protocol (matches server hardware-protocol.schema.json) ──────────

export type HardwareProtocolSequenceStep = {
  order: number;
  modality: "thermal" | "photobiomodulation" | "vibro_acoustic" | "combined";
  intensity: number;
  durationMinutes: number;
  notes?: string;
};

export type HardwareProtocolPad = {
  placement: string;
  placementDetail?: string;
  thermalMode: "heat" | "cool" | "neutral";
  vibroAcousticIntensity?: number;
  lightIntensity?: number;
};

/** Full Hardware_Protocol as returned by the backend (matches schema v1.0.0). */
export type HardwareProtocol = {
  schemaVersion: string;
  sessionDurationMinutes: number;
  sequence: HardwareProtocolSequenceStep[];
  sunPad: HardwareProtocolPad;
  moonPad: HardwareProtocolPad;
  photobiomodulation?: { redNm: number; blueNm: number };
  dailyHabit?: string;
};

// ─── API response types ───────────────────────────────────────────────────────

export type GenerateProtocolResponse = {
  hardwareProtocol: HardwareProtocol;
  sessionId: string;
  voiceAudio?: {
    url: string;
    durationSeconds: number;
    script?: string;
    fallback?: boolean;
  };
  /** Hydrawav3 device dispatch result — live when API credentials are configured */
  deviceSession?: {
    live: boolean;
    topic: string;
    status: "published" | "simulated" | "error";
    message: string;
    payload?: Record<string, unknown>;
  };
  validation?: {
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

/** Richer per-day state for the gamified client dashboard. */
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
  dailyHabit?: string;
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