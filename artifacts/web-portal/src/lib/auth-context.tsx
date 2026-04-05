import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface AuthUser {
  username?: string;
  role?: string;
  driverId?: number;
  zone?: string;
  type: "admin" | "driver";
}

interface AuthContextType {
  user: AuthUser | null;
  loginAdmin: (username: string, role: string) => void;
  loginDriver: (driverId: number, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("aces_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.type === "admin" || parsed.type === "driver") {
          setUser(parsed);
        } else {
          localStorage.removeItem("aces_auth");
        }
      } catch (e) {
        localStorage.removeItem("aces_auth");
      }
    }
  }, []);

  const loginAdmin = (username: string, role: string) => {
    const newUser: AuthUser = { type: "admin", username, role };
    localStorage.setItem("aces_auth", JSON.stringify(newUser));
    setUser(newUser);
  };

  const loginDriver = (driverId: number, username: string) => {
    const newUser: AuthUser = { type: "driver", driverId, username };
    localStorage.setItem("aces_auth", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    const type = user?.type;
    localStorage.removeItem("aces_auth");
    setUser(null);
    if (type === "driver") {
      setLocation("/driver/login");
    } else {
      setLocation("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginAdmin, loginDriver, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
