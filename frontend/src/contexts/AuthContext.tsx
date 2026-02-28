import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

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

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

/**
 * When VITE_LOCAL_DEV is set (or no Firebase API key is configured) the
 * frontend runs in local-dev mode: Firebase is not initialised and the
 * backend is called directly with simple local tokens.
 */
const IS_LOCAL_DEV: boolean =
  import.meta.env.VITE_LOCAL_DEV === "true" ||
  !import.meta.env.VITE_FIREBASE_API_KEY;

// ---------------------------------------------------------------------------
// Local-dev auth provider — no Firebase dependency
// ---------------------------------------------------------------------------

const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-login as the default dev user on mount.
  useEffect(() => {
    setUser({
      uid: "local-dev-user",
      email: "dev@localhost",
      displayName: "Dev User",
      role: "admin",
      token: "dev-bypass",
    });
    setLoading(false);
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    // In local mode any login just gives you the dev user.
    setUser({
      uid: "local-dev-user",
      email: _email,
      displayName: "Dev User",
      role: "admin",
      token: "dev-bypass",
    });
  }, []);

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
      const data = await res.json();
      setUser({
        uid: data.uid,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        token: data.token ?? data.uid,
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    // no-op locally
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, resetPassword }),
    [user, loading, login, register, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Firebase auth provider — production path
// ---------------------------------------------------------------------------

const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Dynamic imports so the firebase bundle is never loaded in local-dev mode.
  const {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
  } = require("firebase/auth");
  const { auth } = require("../firebase");

  type User = import("firebase/auth").User;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (fbUser) {
        setUser(await toAppUser(fbUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [toAppUser, onAuthStateChanged, auth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(await toAppUser(cred.user));
    },
    [toAppUser, signInWithEmailAndPassword, auth],
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
    [toAppUser, signInWithEmailAndPassword, updateProfile, auth],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, [signOut, auth]);

  const resetPassword = useCallback(
    async (email: string) => {
      await sendPasswordResetEmail(auth, email);
    },
    [sendPasswordResetEmail, auth],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, resetPassword }),
    [user, loading, login, register, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Export the right provider based on the environment
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = IS_LOCAL_DEV
  ? LocalAuthProvider
  : FirebaseAuthProvider;

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
