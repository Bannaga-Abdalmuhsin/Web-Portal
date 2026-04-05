import { useState } from "react";
import { useMissions, useCreateMission, useDeleteMission } from "@/hooks/use-missions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Trash2, FileText, Eye, CheckCircle, XCircle, RotateCcw, Camera, Droplet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getListMissionsQueryKey } from "@workspace/api-client-react";

interface Driver { id: number; name: string; }

function useDrivers() {
  return useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/drivers`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

const statusColors: Record<string, string> = {
  "Creation": "bg-orange-100 text-orange-700 hover:bg-orange-200",
  "Finished by Driver": "bg-sky-100 text-sky-700 hover:bg-sky-200",
  "Task approved": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  "Reported by driver": "bg-rose-100 text-rose-700 hover:bg-rose-200",
  "Canceled": "bg-slate-100 text-slate-700 hover:bg-slate-200"
};

const formSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  generator: z.string().optional(),
  project: z.string().optional(),
  missionStatus: z.string().min(1, "Status is required"),
  driverName: z.string().optional(),
  filledLiters: z.coerce.number().optional(),
});

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DriverEntry {
  missionId: number;
  missionRef: string;
  siteName: string;
  driverName: string;
  litersBefore: number | null;
  litersAdded: number | null;
  completionDate: string | null;
  notes: string | null;
  odoBeforePhoto: string | null;
  odoAfterPhoto: string | null;
  tankBeforePhoto: string | null;
  tankAfterPhoto: string | null;
  submittedAt: string | null;
}

function PhotoThumb({ src, label, icon }: { src: string | null; label: string; icon: React.ReactNode }) {
  if (!src) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-full h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5">
          <div className="text-slate-300">{icon}</div>
          <span className="text-xs text-slate-400">No photo</span>
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={src}
        alt={label}
        className="w-full h-32 object-cover rounded-xl border border-slate-200 cursor-zoom-in"
        onClick={() => window.open(src, "_blank")}
        title="Click to view full size"
      />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

function MissionReviewSheet({
  missionId,
  missionRef,
  open,
  onClose,
}: {
  missionId: number | null;
  missionRef: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [acting, setActing] = useState<"approve" | "reject" | "send-back" | null>(null);

  const { data: entry, isLoading } = useQuery<DriverEntry>({
    queryKey: ["mission-entry", missionId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/missions/${missionId}/entry`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!missionId && open,
  });

  const doAction = async (action: "approve" | "reject" | "send-back") => {
    if (!missionId) return;
    setActing(action);
    try {
      const res = await fetch(`${apiBase}/api/missions/${missionId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "Admin" }),
      });
      if (!res.ok) throw new Error("Action failed");
      const labels: Record<string, string> = {
        approve: "Mission approved and added to report",
        reject: "Mission rejected",
        "send-back": "Mission sent back to driver",
      };
      toast({ title: labels[action] });
      queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["report-lines"] });
      onClose();
    } catch {
      toast({ title: "Action failed. Please try again.", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <SheetTitle className="text-xl font-bold text-slate-900">
            Driver Submission Review
          </SheetTitle>
          <p className="text-sm text-slate-500 mt-0.5">{missionRef}</p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400">
                Loading submission...
              </div>
            ) : !entry ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                <FileText className="w-8 h-8 opacity-50" />
                <p className="text-sm">No driver submission found for this mission.</p>
              </div>
            ) : (
              <>
                {/* Driver info + entries */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Driver Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Driver</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.driverName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Site</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.siteName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Liters Before</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.litersBefore != null ? `${entry.litersBefore} L` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Liters Added</p>
                      <p className="text-sm font-bold text-emerald-700 text-base">
                        {entry.litersAdded != null ? `${entry.litersAdded} L` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Completion Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.completionDate ? new Date(entry.completionDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Submitted At</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="pt-1">
                      <p className="text-xs text-slate-500">Notes</p>
                      <p className="text-sm text-slate-700 mt-0.5">{entry.notes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* ODO Meter Photos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">ODO Meter</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PhotoThumb
                      src={entry.odoBeforePhoto}
                      label="Before"
                      icon={<Camera className="w-7 h-7" />}
                    />
                    <PhotoThumb
                      src={entry.odoAfterPhoto}
                      label="After"
                      icon={<Camera className="w-7 h-7" />}
                    />
                  </div>
                </div>

                <Separator />

                {/* Tank Photos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-sky-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Tank Readings</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PhotoThumb
                      src={entry.tankBeforePhoto}
                      label="Before"
                      icon={<Droplet className="w-7 h-7" />}
                    />
                    <PhotoThumb
                      src={entry.tankAfterPhoto}
                      label="After"
                      icon={<Droplet className="w-7 h-7" />}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="grid grid-cols-3 gap-3">
            <Button
              className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
              onClick={() => doAction("approve")}
              disabled={!!acting}
            >
              <CheckCircle className="w-4 h-4" />
              {acting === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl font-semibold"
              onClick={() => doAction("send-back")}
              disabled={!!acting}
            >
              <RotateCcw className="w-4 h-4" />
              {acting === "send-back" ? "Sending..." : "Send Back"}
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
              onClick={() => doAction("reject")}
              disabled={!!acting}
            >
              <XCircle className="w-4 h-4" />
              {acting === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Missions() {
  const { user } = useAuth();
  const supervisorRegion = user?.role === "supervisor" ? (user.region || "") : "";
  const { data: missions, isLoading } = useMissions();
  const { data: drivers = [] } = useDrivers();
  const createMutation = useCreateMission();
  const deleteMutation = useDeleteMission();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewMission, setReviewMission] = useState<{ id: number; ref: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: "",
      generator: "",
      project: "stc COW",
      missionStatus: "Creation",
      driverName: "",
      filledLiters: 0,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Mission created successfully" });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to create mission", variant: "destructive" })
    });
  };

  const filteredMissions = missions?.filter(m => {
    const matchSearch = m.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.missionId?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());
    const mRegion = (m as any).region || (m as any).city || "";
    const matchRegion = !supervisorRegion || mRegion.toUpperCase() === supervisorRegion.toUpperCase();
    return matchSearch && matchRegion;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search missions by site or ID..."
            className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 items-start flex-wrap">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all">
                <Plus className="w-5 h-5 mr-2" />
                New Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display text-slate-900">Create Mission</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. COW531" className="h-11 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="driverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select driver..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {drivers.map((d) => (
                              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="missionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Creation">Creation</SelectItem>
                            <SelectItem value="Finished by Driver">Finished by Driver</SelectItem>
                            <SelectItem value="Task approved">Task approved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-base shadow-lg shadow-primary/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Save Mission"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass-panel border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-600 h-12">Mission ID</TableHead>
              <TableHead className="font-semibold text-slate-600">Site</TableHead>
              <TableHead className="font-semibold text-slate-600">Region</TableHead>
              <TableHead className="font-semibold text-slate-600">Driver</TableHead>
              <TableHead className="font-semibold text-slate-600">Liters</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">Loading missions...</TableCell>
              </TableRow>
            ) : filteredMissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p>No missions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMissions?.map((mission) => (
                <TableRow key={mission.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="font-medium text-slate-900">{mission.missionId || `MSN-${mission.id}`}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{mission.siteName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                      {(mission as any).region || mission.city || '—'}
                    </span>
                  </TableCell>
                  <TableCell>{mission.driverName || 'Unassigned'}</TableCell>
                  <TableCell className="font-medium text-slate-700">{mission.filledLiters || 0} L</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 shadow-sm ${statusColors[mission.missionStatus] || statusColors['Creation']}`}>
                      {mission.missionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {mission.missionStatus === "Finished by Driver" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg gap-1.5 font-medium text-xs"
                          onClick={() => setReviewMission({ id: mission.id!, ref: mission.missionId || `MSN-${mission.id}` })}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => {
                          if (confirm('Delete this mission?')) {
                            deleteMutation.mutate({ id: mission.id }, {
                              onSuccess: () => toast({ title: "Deleted" })
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <MissionReviewSheet
        missionId={reviewMission?.id ?? null}
        missionRef={reviewMission?.ref ?? ""}
        open={!!reviewMission}
        onClose={() => setReviewMission(null)}
      />
    </div>
  );
}
