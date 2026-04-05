import { useState } from "react";
import { useMissions, useCreateMission, useDeleteMission } from "@/hooks/use-missions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, FileText, Zap, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Missions() {
  const { data: missions, isLoading } = useMissions();
  const createMutation = useCreateMission();
  const deleteMutation = useDeleteMission();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch(`${apiBase}/api/missions/generate-from-sites`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast({ title: result.error || "Generation failed", variant: "destructive" }); return; }
      setGenResult(result);
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({ title: result.created > 0 ? `Created ${result.created} mission${result.created !== 1 ? "s" : ""}` : "No new missions — all due sites already have open missions" });
    } catch {
      toast({ title: "Failed to generate missions", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

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

  const filteredMissions = missions?.filter(m => 
    m.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.missionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Generate from Sites */}
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              className="h-12 px-5 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Zap className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`} />
              {generating ? "Generating…" : "Generate from Due Sites"}
            </Button>
            {genResult && (
              <div className="text-xs text-slate-500 px-1 flex items-center gap-1">
                {genResult.errors.length > 0 && <AlertCircle className="w-3 h-3 text-red-400" />}
                ✓ {genResult.created} created · {genResult.skipped} skipped
              </div>
            )}
          </div>

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
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Assign driver..." className="h-11 rounded-xl" {...field} />
                      </FormControl>
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
              <TableHead className="font-semibold text-slate-600">Driver</TableHead>
              <TableHead className="font-semibold text-slate-600">Liters</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">Loading missions...</TableCell>
              </TableRow>
            ) : filteredMissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
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
                    <div className="text-xs text-slate-500">{mission.city || 'Riyadh'}</div>
                  </TableCell>
                  <TableCell>{mission.driverName || 'Unassigned'}</TableCell>
                  <TableCell className="font-medium text-slate-700">{mission.filledLiters || 0} L</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 shadow-sm ${statusColors[mission.missionStatus] || statusColors['Creation']}`}>
                      {mission.missionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
