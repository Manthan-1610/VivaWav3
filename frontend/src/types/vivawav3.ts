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

export type HardwareProtocol = {
  schemaVersion: string;
  sessionDurationMinutes: number;
  sequence: HardwareProtocolSequenceStep[];
  sunPad: HardwareProtocolPad;
  moonPad: HardwareProtocolPad;
  photobiomodulation?: { redNm: number; blueNm: number };
  dailyHabit?: string;
};

export type GenerateProtocolResponse = {
  hardwareProtocol: HardwareProtocol;
  sessionId: string;
  voiceAudio?: {
    url: string;
    durationSeconds: number;
    script?: string;
    fallback?: boolean;
  };
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
  entries: RecoveryEntry[];
};

export type SessionStatus = "Ready" | "Recovering" | "New" | "Needs Attention";

export type ClientSummary = {
  userId: string;
  displayName: string;
  clientEmail?: string | null;
  lastRecoveryScore: number | null;
  scoreDate: string | null;
  mobilityStreakDays: number;
  level: number;
  status: SessionStatus;
  lastSessionAt?: string | null;
  lastCheckInAt?: string | null;
};

export type SavedAssessmentSession = {
  sessionId: string;
  practitionerId: string;
  clientId: string;
  clientEmail: string;
  displayName: string;
  recoveryScore: number;
  scoreDate: string;
  mobilityStreakDays: number;
  level: number;
  status: SessionStatus;
  bodySnapshot: BodySnapshot;
  protocol: HardwareProtocol;
  voiceAudio?: GenerateProtocolResponse["voiceAudio"] | null;
  validation?: GenerateProtocolResponse["validation"] | null;
  deviceSession?: GenerateProtocolResponse["deviceSession"] | null;
  createdAt: string;
};

export type ClientsListResponse = {
  practitionerId: string;
  clients: ClientSummary[];
};

export type SessionsResponse = {
  practitionerId?: string;
  clientId?: string;
  sessions: SavedAssessmentSession[];
};

export type RecoveryListResponse = {
  userId: string;
  entries: RecoveryEntry[];
};