import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DriverNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function DriverNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/driver/notifications?driverId=${user?.driverId}`);
        if (res.ok) setNotifications(await res.json());
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.driverId) load();
  }, [user?.driverId]);

  const typeColors: Record<string, string> = {
    info: "bg-sky-100 text-sky-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" /> Notifications
      </h1>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No notifications yet</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`border-0 shadow-sm ${!n.read ? "border-l-4 border-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                    <div className="text-xs text-slate-400 mt-2">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <Badge className={typeColors[n.type] || "bg-slate-100 text-slate-600"}>{n.type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
