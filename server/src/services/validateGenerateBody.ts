export type GenerateProtocolBody = {
  userId: string;
  practitionerId: string;
  asymmetry: Record<string, unknown>;
  wearables: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type ValidateResult =
  | { ok: true; data: GenerateProtocolBody }
  | { ok: false; details: string[] };

export function validateGenerateBody(body: unknown): ValidateResult {
  const details: string[] = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, details: ["Request body must be a JSON object"] };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.userId !== "string" || !b.userId.trim()) {
    details.push("userId is required");
  }
  if (typeof b.practitionerId !== "string" || !b.practitionerId.trim()) {
    details.push("practitionerId is required");
  }
  if (
    !b.asymmetry ||
    typeof b.asymmetry !== "object" ||
    Array.isArray(b.asymmetry)
  ) {
    details.push("asymmetry must be an object");
  }
  if (details.length) return { ok: false, details };

  const wearables =
    b.wearables &&
    typeof b.wearables === "object" &&
    !Array.isArray(b.wearables)
      ? (b.wearables as Record<string, unknown>)
      : {};

  const metadata =
    b.metadata &&
    typeof b.metadata === "object" &&
    !Array.isArray(b.metadata)
      ? (b.metadata as Record<string, unknown>)
      : undefined;

  return {
    ok: true,
    data: {
      userId: b.userId as string,
      practitionerId: b.practitionerId as string,
      asymmetry: b.asymmetry as Record<string, unknown>,
      wearables,
      metadata,
    },
  };
}
