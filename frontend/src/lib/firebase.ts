import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function readWebConfig(): FirebaseOptions {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

  const missing: string[] = [];
  if (!apiKey) missing.push("VITE_FIREBASE_API_KEY");
  if (!authDomain) missing.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (!projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!storageBucket) missing.push("VITE_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missing.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missing.push("VITE_FIREBASE_APP_ID");

  if (missing.length > 0) {
    throw new Error(
      [
        "Firebase client config is incomplete.",
        `Missing: ${missing.join(", ")}.`,
        "Copy frontend/.env.example to frontend/.env.local, paste the Web app values from Firebase Console (Project settings → Your apps → Web), and restart Vite.",
        "Only variables prefixed with VITE_ are exposed to the browser.",
      ].join(" "),
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

const firebaseConfig = readWebConfig();

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
