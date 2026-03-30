import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DriverMissionDetail() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [task, setTask] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entry, setEntry] = useState({
    actualInTank: "",
    quantityAdded: "",
    observations: "",
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/driver/tasks/${params.id}`);
        if (res.ok) setTask(await res.json());
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [params.id]);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/driver/tasks/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          actualInTank: Number(entry.actualInTank),
          quantityAdded: Number(entry.quantityAdded),
          observations: entry.observations,
        }),
      });
      setLocation("/driver/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!task) return (
    <div className="text-center py-16 text-slate-500">Task not found</div>
  );

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700",
    in_progress: "bg-sky-100 text-sky-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/driver/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Mission Detail</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{task.siteName}</CardTitle>
          <Badge className={statusColors[task.status] || "bg-slate-100 text-slate-600"}>
            {task.status?.replace(/_/g, " ")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Mission ID</span>
            <span className="font-medium">{task.missionId || task.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Required Liters</span>
            <span className="font-medium">{task.requiredLiters} L</span>
          </div>
          {task.notes && (
            <div className="pt-2">
              <span className="text-slate-500">Notes:</span>
              <p className="text-slate-700 mt-1">{task.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {task.status !== "completed" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Submit Fuel Entry</h2>
            <div>
              <Label>Actual Liters in Tank</Label>
              <Input type="number" value={entry.actualInTank} onChange={(e) => setEntry((f) => ({ ...f, actualInTank: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label>Quantity Added (L)</Label>
              <Input type="number" value={entry.quantityAdded} onChange={(e) => setEntry((f) => ({ ...f, quantityAdded: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label>Observations</Label>
              <Textarea value={entry.observations} onChange={(e) => setEntry((f) => ({ ...f, observations: e.target.value }))} placeholder="Any notes or observations..." rows={3} />
            </div>
            <Button onClick={onSubmit} disabled={isSubmitting || !entry.actualInTank || !entry.quantityAdded} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit & Complete
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
