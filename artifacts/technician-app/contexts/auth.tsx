import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { setAuthToken } from "@/lib/api";
import { registerPushToken } from "@/lib/push";

const AUTH_KEY = "aces_tech_auth";

interface TechUser {
  technicianId: number;
  name: string;
  email: string;
  zone: string;
  token: string;
}

interface AuthContextValue {
  user: TechUser | null;
  isLoading: boolean;
  login: (user: TechUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TechUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed: TechUser = JSON.parse(stored);
          setUser(parsed);
          setAuthToken(parsed.token);
          // Re-attempt push token registration on app restart (fire-and-forget)
          registerPushToken(parsed.technicianId).catch(() => undefined);
        }
      } catch {
        // ignore storage errors
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const login = async (u: TechUser) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setAuthToken(u.token);
    // Register device push token (fire-and-forget — gracefully skipped in Expo Go / web)
    registerPushToken(u.technicianId).catch(() => undefined);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
