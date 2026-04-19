import type { ClientsListResponse } from "../types/vivawav3";
import { apiFetch } from "./http";

export async function getClients(): Promise<ClientsListResponse> {
  const res = await apiFetch("/api/clients");
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Unable to load clients.";
    throw new Error(msg);
  }
  return data as ClientsListResponse;
}
