import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin, Droplets, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, Loader2, Search, Filter
} from "lucide-react";

interface Mission {
  id: number;
  missionId: string;
  siteName: string;
  generator: string;
  project: string;
  driverName: string;
  city: string;
  filledLiters: number;
  virtualCalculated: number;
  actualInTank: number;
  quantityAddedLastTask: number;
  missionStatus: string;
  technicianRemark: string;
  technicianStatus: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdDate: string | null;
}

const missionStatusConfig: Record<string, { label: string; color: string }> = {
  "Creation":              { label: "Creation",             color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "Finished by Driver":    { label: "Finished by Driver",   color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  "Task approved":         { label: "Task Approved",        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  "Task returned to driver": { label: "Returned",           color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  "Reported by driver":    { label: "Reported",             color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  "Canceled":              { label: "Canceled",             color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

const techStatusConfig: Record<string, string> = {
  "Pending":  "bg-amber-900/30 text-amber-400 border border-amber-500/30",
  "Reviewed": "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30",
  "Issue":    "bg-red-900/30 text-red-400 border border-red-500/30",
};

const FILTER_TABS = ["All", "Pending Review", "Reviewed", "Approved"];

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const fetchMissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/technician/missions");
      if (res.ok) setMissions(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMissions(); }, []);

  const filtered = useMemo(() => {
    return missions
      .filter((m) => {
        if (search) {
          const q = search.toLowerCase();
          return m.siteName?.toLowerCase().includes(q) || m.missionId?.toLowerCase().includes(q) || m.driverName?.toLowerCase().includes(q);
        }
        return true;
      })
      .filter((m) => {
        if (activeTab === "All") return true;
        if (activeTab === "Pending Review") return !m.technicianStatus || m.technicianStatus === "Pending";
        if (activeTab === "Reviewed") return m.technicianStatus === "Reviewed";
        if (activeTab === "Approved") return m.missionStatus === "Task approved";
        return true;
      });
  }, [missions, search, activeTab]);

  const pendingCount = missions.filter((m) => !m.technicianStatus || m.technicianStatus === "Pending").length;
  const reviewedCount = missions.filter((m) => m.technicianStatus === "Reviewed").length;
  const approvedCount = missions.filter((m) => m.missionStatus === "Task approved").length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
          <div className="text-[10px] text-amber-400/70 uppercase tracking-wider font-medium mt-0.5">Pending</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{reviewedCount}</div>
          <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-medium mt-0.5">Reviewed</div>
        </div>
        <div className="bg-[#E30613]/10 border border-[#E30613]/20 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-[#E30613]">{approvedCount}</div>
          <div className="text-[10px] text-[#E30613]/70 uppercase tracking-wider font-medium mt-0.5">Approved</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search site, mission, driver..."
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-11"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeTab === tab
                ? "bg-[#E30613] border-[#E30613] text-white"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mission list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#E30613]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/3 rounded-3xl border border-white/10 border-dashed">
          <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No missions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const sc = missionStatusConfig[m.missionStatus] || missionStatusConfig["Creation"];
            const tc = techStatusConfig[m.technicianStatus || "Pending"];
            const isPendingReview = !m.technicianStatus || m.technicianStatus === "Pending";

            return (
              <Link key={m.id} href={`/technician/mission/${m.id}`}>
                <Card className={`bg-white/5 border rounded-3xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98] ${isPendingReview ? "border-amber-500/30" : "border-white/10"}`}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="bg-black/30 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 border border-white/10">
                          {m.missionId || `MSN-${m.id}`}
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${sc.color}`}>
                          {sc.label}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white">{m.siteName}</h3>
                      <p className="text-xs text-slate-400 mt-1">{m.generator} · {m.project}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-[#E30613]" /> {m.city || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" /> {m.filledLiters} L
                        </span>
                      </div>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tc}`}>
                          {m.technicianStatus || "Pending"}
                        </span>
                        {m.reviewedBy && (
                          <span className="text-[10px] text-slate-500">by {m.reviewedBy}</span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
