import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { AppUser, UserRole } from "./types";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (args: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type UserDoc = {
  displayName?: string;
  role?: UserRole;
};

async function loadUserProfile(
  uid: string,
  email: string | null,
  displayName: string | null,
): Promise<{ displayName: string | null; role: UserRole }> {
  const ref = doc(db, "users", uid);
  // Registration writes `users/{uid}` right after account creation; retry briefly to avoid a race.
  for (let attempt = 0; attempt < 12; attempt++) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserDoc;
      return {
        displayName: data.displayName ?? displayName,
        role: data.role ?? "client",
      };
    }
    await new Promise((r) => setTimeout(r, 75));
  }
  await setDoc(ref, {
    displayName: displayName ?? email?.split("@")[0] ?? "User",
    role: "client",
    createdAt: serverTimestamp(),
  });
  return { displayName, role: "client" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await loadUserProfile(
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.displayName,
      );
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: profile.displayName ?? firebaseUser.displayName,
        role: profile.role,
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(
    async ({
      email,
      password,
      displayName,
      role,
    }: {
      email: string;
      password: string;
      displayName: string;
      role: UserRole;
    }) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName,
        role,
        createdAt: serverTimestamp(),
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [loading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

