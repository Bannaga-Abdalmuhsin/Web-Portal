import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { setAuthToken } from "@/lib/api";

const AUTH_KEY = "aces_driver_auth";

interface DriverUser {
  driverId: number;
  name: string;
  email: string;
  phone?: string;
  zone: string;
  token: string;
}

interface AuthContextValue {
  user: DriverUser | null;
  isLoading: boolean;
  login: (user: DriverUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed: DriverUser = JSON.parse(stored);
          setUser(parsed);
          setAuthToken(parsed.token);
        }
      } catch {
        // ignore storage errors
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const login = async (u: DriverUser) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setAuthToken(u.token);
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
