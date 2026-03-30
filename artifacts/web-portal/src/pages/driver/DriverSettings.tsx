import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Smartphone } from "lucide-react";

export default function DriverSettings() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Driver ID</span>
            <span className="font-medium">#{user?.driverId}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> App Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Platform</span>
            <span className="font-medium">Web</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full gap-2" onClick={logout}>
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}
