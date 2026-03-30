import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface AuthUser {
  username?: string;
  role?: string;
  driverId?: number;
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
        setUser(JSON.parse(stored));
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
    localStorage.removeItem("aces_auth");
    setUser(null);
    setLocation("/login");
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
