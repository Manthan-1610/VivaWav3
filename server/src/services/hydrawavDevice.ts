/**
 * Hydrawav3 Device API integration service.
 *
 * When HYDRAWAV3_API_BASE_URL + HYDRAWAV3_API_KEY are set (provided at the
 * Saturday workshop), this service POSTs the Gemini-generated Hardware_Protocol
 * to the actual device to start the session — completing the full
 * Know → Act → Learn loop with a live device signal.
 *
 * When credentials are absent we return a simulated response so the rest of
 * the application flow is unchanged and the demo still works without hardware.
 */

import type { HardwareProtocol } from "./hardwareProtocolValidator.js";

export type DeviceSessionResult = {
  /** True when the request reached the real Hydrawav3 device API. */
  live: boolean;
  /** Device-assigned session id (or our synthetic one for simulation). */
  deviceSessionId: string;
  /** Status string returned by device API (or simulated). */
  status: "queued" | "started" | "simulated" | "error";
  /** Human-readable message for logging / UI display. */
  message: string;
};

/**
 * Maps the Hardware_Protocol schema to the Hydrawav3 Pro device API body.
 * Field names align with the MQTT Control API documentation.
 */
function buildDevicePayload(protocol: HardwareProtocol): Record<string, unknown> {
  const sun = protocol.sunPad as Record<string, unknown> | undefined;
  const moon = protocol.moonPad as Record<string, unknown> | undefined;
  const pbm = protocol.photobiomodulation as Record<string, unknown> | undefined;

  return {
    sessionDurationMinutes: protocol.sessionDurationMinutes ?? 9,
    modalities: {
      thermal: {
        enabled: true,
        sunPad: {
          placement: sun?.placement ?? "lower_back",
          thermalMode: sun?.thermalMode ?? "heat",
          lightIntensity: sun?.lightIntensity ?? 50,
          vibroAcousticIntensity: sun?.vibroAcousticIntensity ?? 40,
        },
        moonPad: {
          placement: moon?.placement ?? "mid_back",
          thermalMode: moon?.thermalMode ?? "cool",
          lightIntensity: moon?.lightIntensity ?? 50,
          vibroAcousticIntensity: moon?.vibroAcousticIntensity ?? 40,
        },
      },
      photobiomodulation: {
        enabled: true,
        redNm: pbm?.redNm ?? 660,
        blueNm: pbm?.blueNm ?? 450,
      },
      vibroAcoustic: {
        enabled: true,
      },
    },
    sequence: Array.isArray(protocol.sequence)
      ? protocol.sequence.map((s: Record<string, unknown>) => ({
          order: s.order,
          modality: s.modality,
          intensity: s.intensity,
          durationMinutes: s.durationMinutes,
        }))
      : [],
    schemaVersion: protocol.schemaVersion ?? "1.0.0",
  };
}

export async function sendProtocolToDevice(
  protocol: HardwareProtocol,
  sessionId: string,
): Promise<DeviceSessionResult> {
  const baseUrl = process.env.HYDRAWAV3_API_BASE_URL?.trim();
  const apiKey = process.env.HYDRAWAV3_API_KEY?.trim();

  // ── Simulation mode (no credentials) ───────────────────────────────────────
  if (!baseUrl || !apiKey) {
    console.log(
      `[hydrawav3Device] No API credentials — simulating device dispatch for session ${sessionId}`,
    );
    return {
      live: false,
      deviceSessionId: `sim_${sessionId}`,
      status: "simulated",
      message:
        "Protocol queued in simulation mode. Set HYDRAWAV3_API_BASE_URL and HYDRAWAV3_API_KEY to dispatch to a live device.",
    };
  }

  // ── Live API call ───────────────────────────────────────────────────────────
  const payload = buildDevicePayload(protocol);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s — inside 15s SLA

  try {
    const res = await fetch(`${baseUrl}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "(unreadable)");
      console.warn(`[hydrawav3Device] API error ${res.status}:`, errText);
      return {
        live: true,
        deviceSessionId: sessionId,
        status: "error",
        message: `Device API returned HTTP ${res.status}. Protocol was generated but device was not started.`,
      };
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const deviceSessionId =
      typeof data.deviceSessionId === "string" ? data.deviceSessionId : sessionId;
    const status =
      data.status === "started" ? "started" : "queued";

    console.log(`[hydrawav3Device] ✓ Protocol dispatched → deviceSessionId=${deviceSessionId}`);
    return {
      live: true,
      deviceSessionId,
      status,
      message: `Protocol successfully dispatched to Hydrawav3 device. Status: ${status}.`,
    };
  } catch (e) {
    clearTimeout(timeout);
    console.warn(
      "[hydrawav3Device] dispatch failed:",
      e instanceof Error ? e.message : e,
    );
    return {
      live: false,
      deviceSessionId: `err_${sessionId}`,
      status: "error",
      message: "Device dispatch failed — protocol was generated but device was not started.",
    };
  }
}
