/**
 * Hydrawav3 Pro — Device API Integration Service
 *
 * API Base: http://54.241.236.53:8080
 *
 * Flow:
 *   1. POST /api/v1/auth/login  → JWT_ACCESS_TOKEN (24h TTL)
 *   2. POST /api/v1/mqtt/publish  → publishes MQTT command to AWS IoT Core
 *      which routes to the physical Hydrawav3 Pro device.
 *
 * The JWT is cached in memory and refreshed automatically when it expires
 * or on the first call — no manual credential rotation needed.
 */

import type { HardwareProtocol } from "./hardwareProtocolValidator.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const HYDRAWAV3_BASE = "http://54.241.236.53:8080";
const HYDRAWAV3_USERNAME = "testpractitioner";
const HYDRAWAV3_PASSWORD = "1234";

/**
 * MQTT topic that the Hydrawav3 Pro device firmware subscribes to.
 * Based on the ASU hackathon device configuration — the broker routes
 * messages on this topic to the physical device.
 */
const DEVICE_COMMAND_TOPIC = "HydraWav3Pro/command";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceSessionResult = {
  /** True when the request reached the real Hydrawav3 API. */
  live: boolean;
  /** The MQTT topic that was published to. */
  topic: string;
  /** Status string returned by device API (or simulated). */
  status: "published" | "simulated" | "error";
  /** Human-readable message for logging / UI display. */
  message: string;
  /** The full MQTT payload that was dispatched. */
  payload?: Record<string, unknown>;
};

// ─── JWT Token Cache ──────────────────────────────────────────────────────────

type TokenCache = {
  token: string;
  expiresAt: number; // Unix ms
};

let tokenCache: TokenCache | null = null;

/**
 * Returns a fresh JWT access token, re-authenticating only when the cached
 * token has less than 5 minutes remaining.
 */
async function getAccessToken(): Promise<string> {
  const BUFFER_MS = 5 * 60 * 1000; // 5-minute safety buffer
  if (tokenCache && Date.now() < tokenCache.expiresAt - BUFFER_MS) {
    return tokenCache.token;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const res = await fetch(`${HYDRAWAV3_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: HYDRAWAV3_USERNAME,
      password: HYDRAWAV3_PASSWORD,
      rememberMe: true,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Hydrawav3 auth failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as Record<string, string>;
  const raw = data.JWT_ACCESS_TOKEN;
  if (!raw) throw new Error("Hydrawav3 auth response missing JWT_ACCESS_TOKEN");

  // The token is a "Bearer <jwt>" string — extract just the JWT to decode expiry
  const jwt = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  const [, payloadB64] = jwt.split(".");
  let expiresAt = Date.now() + 23 * 60 * 60 * 1000; // default: 23h if decode fails
  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8")) as {
      exp?: number;
    };
    if (decoded.exp) expiresAt = decoded.exp * 1000;
  } catch {
    // ignore decode errors — fall back to 23h expiry
  }

  tokenCache = { token: raw, expiresAt };
  console.log(`[hydrawav3] Token refreshed — expires ${new Date(expiresAt).toISOString()}`);
  return raw;
}

// ─── MQTT Payload Builder ─────────────────────────────────────────────────────

/**
 * Maps the Gemini-generated Hardware_Protocol into the Hydrawav3 Pro
 * MQTT command payload format understood by the device firmware.
 *
 * Based on the ASU hackathon device guide and Hydrawav3 Pro API docs:
 *   - command: "start_session" | "stop_session" | "pause_session"
 *   - modalities: thermal, photobiomodulation, vibroAcoustic
 *   - sequence: ordered phase list (matches device scheduling logic)
 */
function buildMqttPayload(
  protocol: HardwareProtocol,
  sessionId: string,
): Record<string, unknown> {
  const sun = protocol.sunPad as Record<string, unknown> | undefined;
  const moon = protocol.moonPad as Record<string, unknown> | undefined;
  const pbm = protocol.photobiomodulation as Record<string, unknown> | undefined;

  return {
    command: "start_session",
    sessionId,
    schemaVersion: protocol.schemaVersion ?? "1.0.0",
    sessionDurationMinutes: protocol.sessionDurationMinutes ?? 9,
    modalities: {
      thermal: {
        enabled: true,
        sunPad: {
          placement: sun?.placement ?? "lower_back",
          thermalMode: sun?.thermalMode ?? "heat",
          lightIntensity: Number(sun?.lightIntensity ?? 50),
          vibroAcousticIntensity: Number(sun?.vibroAcousticIntensity ?? 40),
        },
        moonPad: {
          placement: moon?.placement ?? "mid_back",
          thermalMode: moon?.thermalMode ?? "cool",
          lightIntensity: Number(moon?.lightIntensity ?? 50),
          vibroAcousticIntensity: Number(moon?.vibroAcousticIntensity ?? 40),
        },
      },
      photobiomodulation: {
        enabled: true,
        redNm: Number(pbm?.redNm ?? 660),
        blueNm: Number(pbm?.blueNm ?? 450),
      },
      vibroAcoustic: {
        enabled: true,
      },
    },
    sequence: Array.isArray(protocol.sequence)
      ? (protocol.sequence as Record<string, unknown>[]).map((s) => ({
          order: s.order,
          modality: s.modality,
          intensity: s.intensity,
          durationMinutes: s.durationMinutes,
          notes: s.notes ?? "",
        }))
      : [],
    source: "ViVaWav3-AI",
    timestamp: new Date().toISOString(),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Authenticates with the Hydrawav3 API, then publishes the AI-generated
 * Hardware_Protocol to the device via the AWS IoT MQTT broker.
 *
 * On any network or auth failure the function returns a clean `error` result
 * instead of throwing — callers never need to catch this.
 */
export async function sendProtocolToDevice(
  protocol: HardwareProtocol,
  sessionId: string,
): Promise<DeviceSessionResult> {
  const mqttPayload = buildMqttPayload(protocol, sessionId);

  try {
    // Step 1 — authenticate (uses cache on repeat calls)
    const token = await getAccessToken();

    // Step 2 — publish to MQTT
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${HYDRAWAV3_BASE}/api/v1/mqtt/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        topic: DEVICE_COMMAND_TOPIC,
        payload: JSON.stringify(mqttPayload),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await res.text().catch(() => "");

    if (!res.ok) {
      console.warn(
        `[hydrawav3] MQTT publish failed: HTTP ${res.status} — ${responseText}`,
      );
      return {
        live: true,
        topic: DEVICE_COMMAND_TOPIC,
        status: "error",
        message: `Device API returned HTTP ${res.status}. Protocol was generated but could not be dispatched.`,
        payload: mqttPayload,
      };
    }

    console.log(
      `[hydrawav3] ✓ Protocol published to ${DEVICE_COMMAND_TOPIC} — sessionId=${sessionId}`,
    );
    console.log(`[hydrawav3] Device response: ${responseText}`);

    return {
      live: true,
      topic: DEVICE_COMMAND_TOPIC,
      status: "published",
      message: `Protocol dispatched to Hydrawav3 Pro device via MQTT. Topic: ${DEVICE_COMMAND_TOPIC}`,
      payload: mqttPayload,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[hydrawav3] dispatch error: ${msg}`);
    return {
      live: false,
      topic: DEVICE_COMMAND_TOPIC,
      status: "error",
      message: `Device dispatch failed (${msg}). Protocol was generated and stored; device command was not sent.`,
      payload: mqttPayload,
    };
  }
}
