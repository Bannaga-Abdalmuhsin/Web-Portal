import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? "bg-primary text-white shadow-md shadow-primary/20" 
          : "text-slate-600 hover:bg-slate-100 hover:text-primary"
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
      <span className="font-medium">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-5 bg-white rounded-full rounded-r-none -mr-4" />}
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user || user.type !== "admin") {
    return null; // Will be redirected by AuthGuard
  }

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/missions", icon: FileText, label: "Missions" },
    { href: "/sites", icon: MapPin, label: "Sites" },
    { href: "/drivers", icon: Users, label: "Drivers" },
    { href: "/reports", icon: FileText, label: "Reports" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/admins", icon: ShieldCheck, label: "Admins" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 shadow-xl shadow-slate-200/20 z-30 flex flex-col">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <img 
            src={`${import.meta.env.BASE_URL}images/aces-logo-main.png`} 
            alt="ACES Logo" 
            className="h-10 object-contain"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="px-4 text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 mt-2">Main Menu</div>
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              isActive={location === item.href} 
            />
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 glass-panel border-b border-slate-200/50 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-xl font-display font-bold text-slate-800 capitalize">
            {location === "/" ? "Dashboard" : location.split('/')[1].replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm border-slate-200 text-slate-600 hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
