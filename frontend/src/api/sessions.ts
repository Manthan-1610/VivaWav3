import { apiFetch } from "./http";
import type { SavedAssessmentSession, SessionsResponse } from "../types/vivawav3";

export async function getSessions(filter?: {
  practitionerId?: string;
  clientId?: string;
}): Promise<SessionsResponse> {
  const params = new URLSearchParams();
  if (filter?.practitionerId) params.set("practitionerId", filter.practitionerId);
  if (filter?.clientId) params.set("clientId", filter.clientId);

  const path = params.toString() ? `/api/session?${params.toString()}` : "/api/session";
  const res = await apiFetch(path);

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Unable to load sessions.";
    throw new Error(msg);
  }

  return data as SessionsResponse;
}

export async function saveAssessmentSession(
  session: SavedAssessmentSession,
): Promise<SavedAssessmentSession> {
  const res = await apiFetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Unable to save session.";
    throw new Error(msg);
  }

  return (data as { ok: true; session: SavedAssessmentSession }).session;
}