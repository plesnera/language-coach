import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { API_BASE } from "../config/endpoints";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


/**
 * Whether the app is running under Vitest.
 * Used to avoid emulator auto-login network calls during unit tests.
 */
const IS_TEST_ENV: boolean = Boolean(import.meta.env.VITEST);

/**
 * Whether the app is in local-dev mode (running against emulators).
 * Used to trigger auto-login with the seeded local-test-user.
 */
const IS_LOCAL_DEV: boolean =
  !IS_TEST_ENV &&
  (
    import.meta.env.VITE_LOCAL_DEV === "true" ||
    (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY)
  );

// ---------------------------------------------------------------------------
// Single Firebase auth provider — works with both production & emulator
// ---------------------------------------------------------------------------

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

type User = import("firebase/auth").User;

const InternalAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(!IS_TEST_ENV);

  const toAppUser = useCallback(async (fbUser: User): Promise<AppUser> => {
    const tokenResult = await fbUser.getIdTokenResult();
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      role: (tokenResult.claims.role as string) ?? "user",
      token: tokenResult.token,
    };
  }, []);

  useEffect(() => {
    if (IS_TEST_ENV) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (fbUser) {
        setUser(await toAppUser(fbUser));
      } else {
        // In local-dev mode, auto-login with the seeded emulator user.
        if (IS_LOCAL_DEV) {
          try {
            const cred = await signInWithEmailAndPassword(
              auth,
              "local-test-user@localhost",
              "devpassword",
            );
            setUser(await toAppUser(cred.user));
          } catch (err) {
            console.error("Auto-login failed", err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [toAppUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(await toAppUser(cred.user));
    },
    [toAppUser],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Registration failed");
      }
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      setUser(await toAppUser(cred.user));
    },
    [toAppUser],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, resetPassword }),
    [user, loading, login, register, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = InternalAuthProvider;

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
