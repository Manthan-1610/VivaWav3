import type { RecoveryListResponse } from "../types/vivawav3";
import { apiFetch } from "./http";

export async function getRecovery(userId: string): Promise<RecoveryListResponse> {
  const res = await apiFetch(`/api/recovery/${encodeURIComponent(userId)}`);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Unable to load recovery data.";
    throw new Error(msg);
  }
  return data as RecoveryListResponse;
}
