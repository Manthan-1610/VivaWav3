import { apiFetch } from "./http";

export type EngagementData = {
  userId: string;
  xpTotal: number;
  level: number;
  streakDays: number;
  lastSessionDate: string | null;
};

export async function getEngagement(userId: string): Promise<EngagementData> {
  const res = await apiFetch(`/api/engagement/${userId}`);
  const data = await res.json() as { ok: boolean; engagement: EngagementData };
  if (!res.ok || !data.ok) {
    throw new Error("Failed to load engagement data");
  }
  return data.engagement;
}
