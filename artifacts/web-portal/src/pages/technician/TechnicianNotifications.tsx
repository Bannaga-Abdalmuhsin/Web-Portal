import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Loader2, Info } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  driverName?: string;
  sentBy: string;
  createdAt: string;
}

export default function TechnicianNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) setNotifications(await res.json());
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#E30613]" /> Alerts & Updates
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#E30613]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-sm">No alerts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.slice(0, 20).map((n) => (
            <Card key={n.id} className="bg-white/5 border-white/10 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{n.title}</div>
                    <div className="text-slate-400 text-xs mt-1">{n.message}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {n.driverName && (
                        <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                          → {n.driverName}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
