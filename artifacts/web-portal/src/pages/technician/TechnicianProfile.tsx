import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Wrench, Phone, Mail, MapPin } from "lucide-react";

export default function TechnicianProfile() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">My Profile</h1>

      <Card className="bg-white/5 border-white/10 rounded-3xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#E30613] to-[#a01010] flex items-center justify-center shadow-lg shadow-[#E30613]/20">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.username}</h2>
              <p className="text-sm text-slate-400">Technician</p>
            </div>
          </div>

          <div className="space-y-3">
            {(user as any)?.zone && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-[#E30613] flex-shrink-0" />
                <span className="text-slate-400">Zone:</span>
                <span className="text-white font-medium">{(user as any).zone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 ml-7">Technician ID:</span>
              <span className="text-white font-medium">#{user?.driverId}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 rounded-3xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-white mb-3">App Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Platform</span>
              <span className="text-white">ACES Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Module</span>
              <span className="text-white">Technician Follow-up</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={logout}
        className="w-full h-12 rounded-2xl font-bold bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 gap-2"
        variant="outline"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}
