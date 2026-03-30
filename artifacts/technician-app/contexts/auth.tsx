import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Platform } from "react-native";
import { setAuthToken } from "@/lib/api";

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
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const login = async (u: TechUser) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setAuthToken(u.token);
    if (Platform.OS !== "web") {
      registerPushToken(u.technicianId, u.token).catch(() => {});
    }
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

async function registerPushToken(technicianId: number, token: string) {
  try {
    const { default: Notifications } = await import("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_REPL_ID,
    });

    const { apiFetch } = await import("@/lib/api");
    await apiFetch(`/api/technicians/${technicianId}/expo-push-token`, {
      method: "PUT",
      body: JSON.stringify({ expoPushToken: pushToken.data }),
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Non-critical: push registration failures should not block login
  }
}
