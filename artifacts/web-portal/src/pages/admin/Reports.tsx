import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, MapPin, Droplet, FileText, BarChart3 } from "lucide-react";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReportLine {
  id: number;
  missionRef: string;
  siteName: string;
  region: string;
  project: string;
  driverName: string;
  litersAdded: number;
  completionDate: string | null;
  approvedAt: string | null;
  approvedBy: string;
  unitPrice: number;
  invoiceExported: boolean;
}

const REGION_COLORS: Record<string, string> = {
  "Riyadh": "bg-blue-100 text-blue-700",
  "Jeddah": "bg-purple-100 text-purple-700",
  "Dammam": "bg-orange-100 text-orange-700",
  "Arar": "bg-rose-100 text-rose-700",
  "Rafah": "bg-amber-100 text-amber-700",
  "JUBAIL": "bg-emerald-100 text-emerald-700",
  "TURAIF": "bg-sky-100 text-sky-700",
};

export default function ReportsPage() {
  const { data: reportLines = [], isLoading } = useQuery<ReportLine[]>({
    queryKey: ["report-lines"],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/report-lines`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [siteQuery, setSiteQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [unitPrice] = useState(0.63);
  const vatRate = 0.15;

  const REGIONS = ["CENTRAL", "EAST"];

  const lines = useMemo(() => {
    return reportLines
      .filter((l) => regionFilter === "all" || l.region.toUpperCase() === regionFilter)
      .filter((l) => !siteQuery || l.siteName?.toLowerCase().includes(siteQuery.toLowerCase()))
      .filter((l) => {
        if (!fromDate && !toDate) return true;
        const d = l.approvedAt ? new Date(l.approvedAt) : null;
        if (!d) return false;
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate + "T23:59:59")) return false;
        return true;
      })
      .map((l) => ({
        ...l,
        linePrice: l.litersAdded * unitPrice,
      }));
  }, [reportLines, fromDate, toDate, siteQuery, regionFilter, unitPrice]);

  // Group by region for summary
  const byRegion = useMemo(() => {
    const map: Record<string, { liters: number; lines: number; amount: number }> = {};
    for (const l of lines) {
      const r = l.region || "Unknown";
      if (!map[r]) map[r] = { liters: 0, lines: 0, amount: 0 };
      map[r].liters += l.litersAdded;
      map[r].lines += 1;
      map[r].amount += l.linePrice;
    }
    return Object.entries(map).sort((a, b) => b[1].liters - a[1].liters);
  }, [lines]);

  const subtotal = lines.reduce((s, l) => s + l.linePrice, 0);
  const vat = subtotal * vatRate;
  const total = subtotal + vat;
  const totalLiters = lines.reduce((s, l) => s + l.litersAdded, 0);

  const exportCSV = () => {
    const rows = [
      ["Mission", "Site", "Region", "Driver", "Approved Date", "Liters", "Unit Price", "Line Total"],
      ...lines.map((l) => [
        l.missionRef,
        l.siteName,
        l.region,
        l.driverName,
        l.approvedAt ? new Date(l.approvedAt).toLocaleDateString() : "",
        l.litersAdded,
        unitPrice.toFixed(2),
        l.linePrice.toFixed(2),
      ])
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aces-report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Approved missions — fuel quantities by region for invoice preparation</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 h-11 rounded-xl">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Approved Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{lines.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Liters</p>
            <p className="text-2xl font-bold text-sky-700 mt-1">{totalLiters.toLocaleString()} L</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Subtotal</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{subtotal.toFixed(0)} SAR</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total + VAT</p>
            <p className="text-2xl font-bold text-primary mt-1">{total.toFixed(0)} SAR</p>
          </CardContent>
        </Card>
      </div>

      {/* Region summary */}
      {byRegion.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">By Region</h2>
          </div>
          <div className="flex flex-wrap gap-3 px-4 pb-4">
            {byRegion.map(([region, data]) => (
              <div
                key={region}
                className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{region || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{data.lines} tasks · {data.liters.toLocaleString()} L</p>
                  <p className="text-xs font-semibold text-emerald-700">{data.amount.toFixed(0)} SAR</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-xs mb-1 block">From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Region</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Site</Label>
              <Input placeholder="Filter by site..." value={siteQuery} onChange={(e) => setSiteQuery(e.target.value)} className="w-48 h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-bold text-slate-600 uppercase">#</TableHead>
              <TableHead className="text-xs font-bold text-slate-600 uppercase">Mission</TableHead>
              <TableHead className="text-xs font-bold text-slate-600 uppercase">Site</TableHead>
              <TableHead className="text-xs font-bold text-slate-600 uppercase">Region</TableHead>
              <TableHead className="text-xs font-bold text-slate-600 uppercase">Driver</TableHead>
              <TableHead className="text-xs font-bold text-slate-600 uppercase">Approved</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-600 uppercase">Liters</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-600 uppercase">Unit Price</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-600 uppercase">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-400">Loading report...</TableCell>
              </TableRow>
            ) : lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileText className="w-8 h-8 opacity-50" />
                    <p className="text-sm">No approved missions for the selected filters</p>
                    <p className="text-xs">Approve missions from the Missions page to populate the report</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              lines.map((l, i) => (
                <TableRow key={l.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-slate-500 text-sm">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{l.missionRef}</TableCell>
                  <TableCell className="font-medium text-slate-900">{l.siteName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 text-xs ${REGION_COLORS[l.region] ?? "bg-slate-100 text-slate-600"}`}>
                      {l.region || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-700">{l.driverName || "—"}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {l.approvedAt ? new Date(l.approvedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sky-700">
                    <span className="flex items-center justify-end gap-1">
                      <Droplet className="w-3 h-3" />
                      {l.litersAdded.toFixed(0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">{unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">{l.linePrice.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invoice totals */}
      {lines.length > 0 && (
        <Card className="border-0 shadow-sm ml-auto max-w-sm">
          <CardContent className="p-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Invoice Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal ({totalLiters.toLocaleString()} L)</span>
              <span className="font-medium">{subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT ({(vatRate * 100).toFixed(0)}%)</span>
              <span className="font-medium">{vat.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-3 mt-2">
              <span>Total</span>
              <span className="text-primary text-lg">{total.toFixed(2)} SAR</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
