import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, MapPin, Upload, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface Site {
  id: number;
  name: string;
  region: string;
  district: string;
  city: string;
  cowStatus: string;
  siteLabel: string;
  lat: number | null;
  lng: number | null;
  nextFuelingPlan: string;
  lastFuelingDate: string;
  lastFuelingQty: number | null;
  active: boolean;
  currentLiters: number;
  assignedTechnicianId: number | null;
}

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${apiBase}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  return res;
}

const formSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  region: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  cowStatus: z.string().optional(),
  siteLabel: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  nextFuelingPlan: z.string().optional(),
});

const COW_STATUS_COLORS: Record<string, string> = {
  "ON-AIR": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "OFF-AIR": "bg-red-50 text-red-700 border-red-200",
  "MAINTENANCE": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function Sites() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number; errors: string[]; total: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inserted: number; updated: number; skipped: number; errors: string[]; total: number } | null>(null);

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await apiFetch("/api/sites");
      if (!res.ok) throw new Error("Failed to fetch sites");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiFetch("/api/sites", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create site");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Site created successfully" });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Failed to create site", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiFetch(`/api/sites/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", region: "", district: "", city: "", cowStatus: "ON-AIR", siteLabel: "", lat: "", lng: "", nextFuelingPlan: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({
      ...values,
      lat: values.lat ? parseFloat(values.lat) : undefined,
      lng: values.lng ? parseFloat(values.lng) : undefined,
      project: "stc COW",
      active: true,
    });
  };

  const handleSyncSheets = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiFetch("/api/sites/sync-sheets", { method: "POST" });
      const result = await res.json();
      if (!res.ok) { toast({ title: result.error || "Sync failed", variant: "destructive" }); return; }
      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: `Synced ${result.inserted + result.updated} sites (${result.inserted} new, ${result.updated} updated)` });
    } catch {
      toast({ title: "Sync failed — check your connection", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await apiFetch("/api/sites/import-csv", { method: "POST", body: JSON.stringify({ csv: csvText }) });
      const result = await res.json();
      if (!res.ok) { toast({ title: result.error || "Import failed", variant: "destructive" }); return; }
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: `Imported ${result.inserted} sites successfully` });
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const regions = [...new Set(sites.map((s) => s.region).filter(Boolean))].sort();

  const filteredSites = sites.filter((s) => {
    const matchSearch = !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.siteLabel?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRegion = !regionFilter || s.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const sampleCsv = `sitename,regionname,districtname,cityname,cowstatus,sitelabel,lat,lng,nextfuelingplan,lastfuelingdate,lastfuelingqty
COW531,Central,Al Olaya,Riyadh,ON-AIR,Label-A,24.6877,46.7219,2025-04-10,2025-03-25,500
COW532,Western,Al Aziziyah,Jeddah,OFF-AIR,Label-B,21.3891,39.8579,2025-04-12,2025-03-28,300`;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search sites..."
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Import CSV */}
          <Dialog open={isImportOpen} onOpenChange={(o) => { setIsImportOpen(o); if (!o) { setCsvText(""); setImportResult(null); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 px-4 rounded-xl border-slate-200 gap-2">
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-3xl p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display">Import Sites from CSV / Google Sheets</DialogTitle>
              </DialogHeader>

              <p className="text-sm text-slate-500 mb-3">
                Paste your CSV data below. Accepted column headers (case-insensitive):
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["sitename", "regionname", "districtname", "cityname", "cowstatus", "sitelabel", "lat", "lng", "nextfuelingplan", "lastfuelingdate", "lastfuelingqty"].map((h) => (
                  <span key={h} className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{h}</span>
                ))}
              </div>

              <div className="mb-3">
                <button
                  className="text-xs text-primary underline"
                  onClick={() => setCsvText(sampleCsv)}
                >
                  Load sample CSV
                </button>
              </div>

              <textarea
                className="w-full h-48 font-mono text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Paste CSV here (first row = headers)..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />

              {importResult && (
                <div className={`mt-3 p-3 rounded-xl text-sm ${importResult.errors.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
                  <div className="font-semibold mb-1">
                    ✓ {importResult.inserted} inserted &nbsp;·&nbsp; {importResult.skipped} skipped &nbsp;·&nbsp; {importResult.total} total rows
                  </div>
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-red-600 text-xs flex gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {e}
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full h-12 rounded-xl mt-4 text-base"
                onClick={handleImport}
                disabled={importing || !csvText.trim()}
              >
                {importing ? "Importing..." : "Import Sites"}
              </Button>
            </DialogContent>
          </Dialog>

          {/* Add Site */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2">
                <Plus className="w-4 h-4" /> Add Site
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-3xl p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display">Add New Site</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Site Name / ID *</FormLabel>
                      <FormControl><Input placeholder="e.g. COW531" className="h-11 rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl><Input placeholder="Central" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl><Input placeholder="Al Olaya" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Riyadh" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cowStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>COW Status</FormLabel>
                      <FormControl>
                        <select className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm" {...field}>
                          <option value="ON-AIR">ON-AIR</option>
                          <option value="OFF-AIR">OFF-AIR</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lat" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl><Input placeholder="24.6877" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lng" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl><Input placeholder="46.7219" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="siteLabel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Label</FormLabel>
                      <FormControl><Input placeholder="Label-A" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nextFuelingPlan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Fueling Plan</FormLabel>
                      <FormControl><Input placeholder="2025-04-10" className="h-11 rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" className="col-span-2 h-12 rounded-xl mt-3 text-base shadow-lg shadow-primary/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Site"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Sites", value: sites.length, color: "text-slate-900" },
          { label: "ON-AIR", value: sites.filter(s => s.cowStatus === "ON-AIR").length, color: "text-emerald-600" },
          { label: "OFF-AIR", value: sites.filter(s => s.cowStatus === "OFF-AIR").length, color: "text-red-600" },
          { label: "Regions", value: regions.length, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-panel border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="glass-panel border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-600 h-12">Site Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Region</TableHead>
              <TableHead className="font-semibold text-slate-600">City / District</TableHead>
              <TableHead className="font-semibold text-slate-600">COW Status</TableHead>
              <TableHead className="font-semibold text-slate-600">Coordinates</TableHead>
              <TableHead className="font-semibold text-slate-600">Next Fueling</TableHead>
              <TableHead className="font-semibold text-slate-600">Last Fueling</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">Loading sites...</TableCell>
              </TableRow>
            ) : filteredSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <MapPin className="w-8 h-8 mb-2 opacity-50" />
                    <p>{searchTerm || regionFilter ? "No sites match your filters" : "No sites yet — add one or import from CSV"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSites.map((site) => (
                <TableRow key={site.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell>
                    <div className="font-semibold text-slate-900">{site.name}</div>
                    {site.siteLabel && <div className="text-xs text-slate-400">{site.siteLabel}</div>}
                  </TableCell>
                  <TableCell className="text-slate-700">{site.region || <span className="text-slate-300">—</span>}</TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{site.city || "—"}</div>
                    {site.district && <div className="text-xs text-slate-400">{site.district}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${COW_STATUS_COLORS[site.cowStatus] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {site.cowStatus === "ON-AIR" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {site.cowStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    {site.lat != null && site.lng != null ? (
                      <a
                        href={`https://maps.google.com/?q=${site.lat},${site.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                      </a>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{site.nextFuelingPlan || <span className="text-slate-300">—</span>}</TableCell>
                  <TableCell>
                    {site.lastFuelingDate ? (
                      <div>
                        <div className="text-sm text-slate-700">{site.lastFuelingDate}</div>
                        {site.lastFuelingQty != null && <div className="text-xs text-slate-400">{site.lastFuelingQty} L</div>}
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      onClick={() => {
                        if (confirm(`Delete site "${site.name}"?`)) {
                          deleteMutation.mutate(site.id, {
                            onSuccess: () => toast({ title: "Site deleted" }),
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
