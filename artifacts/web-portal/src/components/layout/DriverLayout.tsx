import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { ClipboardList, Bell, User, LogOut } from "lucide-react";

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user || user.type !== "driver") return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center">
      {/* Mobile container constraint for driver app */}
      <div className="w-full max-w-md bg-slate-950 min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">ACES-MSD Fueling</h1>
            <p className="text-sm text-slate-400">Welcome, {user.username}</p>
          </div>
          <button 
            onClick={logout}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-24 z-10 custom-scrollbar">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-20 pb-safe">
          <div className="flex justify-around items-center p-4">
            <Link 
              href="/driver/dashboard" 
              className={`flex flex-col items-center gap-1 transition-colors ${location === '/driver/dashboard' ? 'text-primary-foreground' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ClipboardList className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Tasks</span>
            </Link>
            
            <Link 
              href="/driver/notifications" 
              className={`flex flex-col items-center gap-1 transition-colors ${location === '/driver/notifications' ? 'text-primary-foreground' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="relative">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-slate-900" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">Alerts</span>
            </Link>

            <Link 
              href="/driver/settings" 
              className={`flex flex-col items-center gap-1 transition-colors ${location === '/driver/settings' ? 'text-primary-foreground' : 'text-slate-500 hover:text-slate-300'}`}
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
