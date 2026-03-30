import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Droplets, MapPin, User, Wrench, CheckCircle2,
  AlertTriangle, Loader2, ClipboardCheck, Clock
} from "lucide-react";

interface Mission {
  id: number;
  missionId: string;
  siteName: string;
  generator: string;
  project: string;
  driverName: string;
  assignedDriver: string;
  city: string;
  filledLiters: number;
  virtualCalculated: number;
  actualInTank: number;
  quantityAddedLastTask: number;
  notes: string;
  missionStatus: string;
  createdBy: string;
  technicianRemark: string;
  technicianStatus: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdDate: string | null;
}

const STATUS_OPTIONS = [
  { value: "Reviewed", label: "✓ Reviewed — Looks OK" },
  { value: "Issue", label: "⚠ Issue Found — Needs Attention" },
  { value: "Pending", label: "◷ Pending — Not Yet Reviewed" },
];

const missionStatusColors: Record<string, string> = {
  "Creation":              "bg-amber-500/15 text-amber-400",
  "Finished by Driver":    "bg-sky-500/15 text-sky-400",
  "Task approved":         "bg-emerald-500/15 text-emerald-400",
  "Task returned to driver": "bg-indigo-500/15 text-indigo-400",
  "Reported by driver":    "bg-rose-500/15 text-rose-400",
  "Canceled":              "bg-slate-500/15 text-slate-400",
};

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value ?? "—"}</span>
    </div>
  );
}

function FuelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{value} L</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TechnicianMissionDetail() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [remark, setRemark] = useState("");
  const [techStatus, setTechStatus] = useState("Reviewed");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/technician/missions");
        if (res.ok) {
          const all: Mission[] = await res.json();
          const found = all.find((m) => m.id === parseInt(params.id));
          if (found) {
            setMission(found);
            setRemark(found.technicianRemark || "");
            setTechStatus(found.technicianStatus || "Reviewed");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id]);

  const onSubmit = async () => {
    if (!mission) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/technician/missions/${mission.id}/followup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianRemark: remark,
          technicianStatus: techStatus,
          reviewedBy: user?.username || "Technician",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMission({ ...mission, ...updated });
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setLocation("/technician/dashboard");
        }, 1500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#E30613]" />
    </div>
  );

  if (!mission) return (
    <div className="text-center py-20 text-slate-500">Mission not found</div>
  );

  const missionColor = missionStatusColors[mission.missionStatus] || "bg-slate-500/15 text-slate-400";
  const maxLiters = Math.max(mission.filledLiters, mission.virtualCalculated, mission.actualInTank, mission.quantityAddedLastTask, 1);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => setLocation("/technician/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* Mission header */}
      <Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10 rounded-3xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="bg-black/30 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 border border-white/10">
              {mission.missionId || `MSN-${mission.id}`}
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${missionColor}`}>
              {mission.missionStatus}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{mission.siteName}</h2>
          <p className="text-slate-400 text-sm">{mission.generator} · {mission.project}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-[#E30613]" /> {mission.city || "—"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <User className="w-3.5 h-3.5 text-sky-400" /> {mission.driverName || mission.assignedDriver || "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Fuel metrics */}
      <Card className="bg-white/5 border-white/10 rounded-3xl">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-sky-400" /> Fuel Readings
          </h3>
          <FuelBar label="Filled Liters" value={mission.filledLiters} max={maxLiters} color="bg-sky-400" />
          <FuelBar label="Virtual Calculated" value={mission.virtualCalculated} max={maxLiters} color="bg-violet-400" />
          <FuelBar label="Actual in Tank" value={mission.actualInTank} max={maxLiters} color="bg-emerald-400" />
          <FuelBar label="Quantity Added" value={mission.quantityAddedLastTask} max={maxLiters} color="bg-amber-400" />
        </CardContent>
      </Card>

      {/* Mission details */}
      <Card className="bg-white/5 border-white/10 rounded-3xl">
        <CardContent className="p-5">
          <h3 className="font-bold text-white text-sm mb-2">Details</h3>
          <InfoRow label="Created By" value={mission.createdBy} />
          <InfoRow label="Date" value={mission.createdDate ? new Date(mission.createdDate).toLocaleDateString() : "—"} />
          {mission.notes && <InfoRow label="Driver Notes" value={mission.notes} />}
        </CardContent>
      </Card>

      {/* Previous review */}
      {mission.reviewedBy && (
        <Card className="bg-emerald-900/20 border-emerald-500/20 rounded-3xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Previous Review</span>
            </div>
            <p className="text-sm text-slate-300">{mission.technicianRemark || "No remark added"}</p>
            <p className="text-xs text-slate-500 mt-1">by {mission.reviewedBy} · {mission.reviewedAt ? new Date(mission.reviewedAt).toLocaleString() : ""}</p>
          </CardContent>
        </Card>
      )}

      {/* Follow-up form */}
      <Card className="bg-white/5 border-white/10 rounded-3xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Wrench className="w-4 h-4 text-[#E30613]" /> Follow-up Review
          </h3>

          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Review Status</label>
            <Select value={techStatus} onValueChange={setTechStatus}>
              <SelectTrigger className="bg-black/30 border-white/10 text-white rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Technician Remark</label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add your follow-up notes or observations..."
              rows={4}
              className="bg-black/30 border-white/10 text-white placeholder:text-slate-600 rounded-xl resize-none"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSaving || saved}
            className="w-full h-12 rounded-xl font-bold text-base transition-all"
            style={{ backgroundColor: saved ? "#10b981" : "#E30613" }}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved!</>
            ) : (
              "Submit Follow-up"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
