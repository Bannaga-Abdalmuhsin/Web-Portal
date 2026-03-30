import { useAuth } from "@/lib/auth-context";
import { useDriverTasks } from "@/hooks/use-drivers";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Droplets, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";

const statusConfig: Record<string, { color: string, icon: React.ElementType }> = {
  "Creation": { color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Clock },
  "Finished by Driver": { color: "text-sky-500 bg-sky-500/10 border-sky-500/20", icon: Droplets },
  "Task approved": { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
};

import { CheckCircle2 } from "lucide-react";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useDriverTasks(user?.driverId || 0);

  if (isLoading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p>Loading your routes...</p>
      </div>
    );
  }

  const activeTasks = tasks?.filter(t => t.status !== "Finished by Driver" && t.status !== "Task approved") || [];
  const completedTasks = tasks?.filter(t => t.status === "Finished by Driver" || t.status === "Task approved") || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-3xl font-display font-bold text-white mb-1">{activeTasks.length}</div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-primary/20 border border-primary/30 rounded-3xl p-5 shadow-lg shadow-primary/10">
          <div className="text-3xl font-display font-bold text-primary-foreground mb-1">{completedTasks.length}</div>
          <div className="text-xs text-primary-foreground/70 font-medium uppercase tracking-wider">Completed</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
          Current Missions
          <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{activeTasks.length}</span>
        </h2>
        
        {activeTasks.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">You have no pending missions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTasks.map(task => (
              <Link key={task.id} href={`/driver/mission/${task.id}`}>
                <Card className="bg-slate-900 border-slate-800 rounded-3xl overflow-hidden hover:bg-slate-800 transition-colors active:scale-[0.98] cursor-pointer">
                  <CardContent className="p-0">
                    <div className="p-5 border-b border-slate-800">
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-slate-950 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 border border-slate-800">
                          {task.missionId || `MSN-${task.id}`}
                        </div>
                        <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${statusConfig[task.status]?.color || statusConfig['Creation'].color}`}>
                          {task.status}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{task.siteName}</h3>
                      <div className="flex items-center text-sm text-slate-400 gap-4 mt-3">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Riyadh Zone</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Today</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/50 px-5 py-4 flex justify-between items-center group">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <Droplets className="w-5 h-5 text-accent" />
                        Target: {task.requiredLiters || 0} L
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
