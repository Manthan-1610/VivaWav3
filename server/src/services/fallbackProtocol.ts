import type { HardwareProtocol } from "./hardwareProtocolValidator.js";

/** Used when Gemini is unavailable or returns invalid JSON after retries (Requirement 4 / 5). */
export const FALLBACK_HARDWARE_PROTOCOL: HardwareProtocol = {
  schemaVersion: "1.0.0",
  sessionDurationMinutes: 9,
  sequence: [
    {
      order: 1,
      modality: "thermal",
      intensity: 55,
      durationMinutes: 3,
      notes: "Gentle thermal contrast to support mobility and comfort.",
    },
    {
      order: 2,
      modality: "photobiomodulation",
      intensity: 50,
      durationMinutes: 3,
      notes: "Light sequence to support surface and deeper tissue wellness.",
    },
    {
      order: 3,
      modality: "vibro_acoustic",
      intensity: 45,
      durationMinutes: 3,
      notes: "Low-frequency resonance to support relaxation and recovery.",
    },
  ],
  sunPad: {
    placement: "lower_back",
    thermalMode: "heat",
    vibroAcousticIntensity: 40,
    lightIntensity: 45,
  },
  moonPad: {
    placement: "mid_back",
    thermalMode: "cool",
    vibroAcousticIntensity: 40,
    lightIntensity: 45,
  },
  photobiomodulation: { redNm: 660, blueNm: 450 },
};
