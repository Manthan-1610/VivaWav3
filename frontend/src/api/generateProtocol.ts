import type { GenerateProtocolResponse } from "../types/vivawav3";
import { apiFetch } from "./http";

export async function postGenerateProtocol(
  body: Record<string, unknown>,
): Promise<GenerateProtocolResponse> {
  const res = await apiFetch("/api/generate-protocol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Unable to generate protocol. Please try again.";
    throw new Error(msg);
  }

  return data as GenerateProtocolResponse;
}
