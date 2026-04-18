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

export type HardwareProtocol = {
  duration: number;
  thermal: string;
  light: string;
  resonance: string;
  guidance: string[];
};