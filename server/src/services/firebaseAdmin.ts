import { readFileSync, existsSync } from "fs";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let initialized = false;

/** Returns true when Admin SDK is configured and initialized (service account + project id). */
export function ensureFirebaseAdmin(): boolean {
  if (initialized) return true;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!path || !projectId || !existsSync(path)) return false;
  if (getApps().length === 0) {
    const sa = JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
    initializeApp({ credential: cert(sa), projectId });
  }
  initialized = true;
  return true;
}

export function getAdminDb() {
  if (!ensureFirebaseAdmin()) return null;
  return getFirestore();
}

export async function verifyIdTokenFromRequest(
  authHeader: string | undefined,
): Promise<{ uid: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || !ensureFirebaseAdmin()) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
