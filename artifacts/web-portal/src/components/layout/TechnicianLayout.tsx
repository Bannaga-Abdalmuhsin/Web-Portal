import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { ClipboardList, Bell, User, LogOut, Wrench } from "lucide-react";

export function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user || user.type !== "technician") return null;

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-[#0B1E3E] min-h-screen flex flex-col relative shadow-2xl overflow-hidden">

        {/* Background gradient */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#E30613]/10 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-[#E30613]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between z-10 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E30613]/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-[#E30613]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white leading-tight">ACES Technician</h1>
              <p className="text-xs text-slate-400">{user.username} · {(user as any).zone || "All Zones"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 pb-24 z-10 py-5">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-[#0B1E3E]/95 backdrop-blur-xl border-t border-white/10 z-20">
          <div className="flex justify-around items-center py-3 px-4">
            <Link
              href="/technician/dashboard"
              className={`flex flex-col items-center gap-1 transition-colors px-4 ${
                isActive("/technician/dashboard") ? "text-[#E30613]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ClipboardList className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Tasks</span>
            </Link>

            <Link
              href="/technician/notifications"
              className={`flex flex-col items-center gap-1 transition-colors px-4 ${
                isActive("/technician/notifications") ? "text-[#E30613]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Bell className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Alerts</span>
            </Link>

            <Link
              href="/technician/profile"
              className={`flex flex-col items-center gap-1 transition-colors px-4 ${
                isActive("/technician/profile") ? "text-[#E30613]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
