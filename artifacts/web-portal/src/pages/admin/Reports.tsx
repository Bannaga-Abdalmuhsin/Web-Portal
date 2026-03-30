import { useMemo, useState } from "react";
import { useListMissions, useGetSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const { data: missions = [] } = useListMissions();
  const { data: settings } = useGetSettings();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [siteQuery, setSiteQuery] = useState("");

  const unitPrice = settings?.fuelUnitPrice ?? 0.63;
  const vatRate = settings?.vatRate ?? 0.15;

  const lines = useMemo(() => {
    return missions
      .filter((m) => m.missionStatus === "Task approved")
      .filter((m) => !siteQuery || m.siteName?.toLowerCase().includes(siteQuery.toLowerCase()))
      .filter((m) => {
        if (!fromDate && !toDate) return true;
        const d = m.createdDate ? new Date(m.createdDate) : null;
        if (!d) return false;
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate + "T23:59:59")) return false;
        return true;
      })
      .map((m) => ({
        taskId: m.id!,
        siteName: m.siteName!,
        region: m.city || "",
        date: m.createdDate ? new Date(m.createdDate).toLocaleDateString() : "",
        liters: m.filledLiters || 0,
        unitPrice,
        linePrice: (m.filledLiters || 0) * unitPrice,
      }));
  }, [missions, fromDate, toDate, siteQuery, unitPrice]);

  const subtotal = lines.reduce((s, l) => s + l.linePrice, 0);
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const exportCSV = () => {
    const rows = [
      ["Site", "Region", "Date", "Liters", "Unit Price", "Line Total"],
      ...lines.map((l) => [l.siteName, l.region, l.date, l.liters, l.unitPrice, l.linePrice.toFixed(2)])
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Invoice reports for approved missions</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label>Site</Label>
              <Input placeholder="Filter by site..." value={siteQuery} onChange={(e) => setSiteQuery(e.target.value)} className="w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>#</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Liters</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={l.taskId}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{l.siteName}</TableCell>
                <TableCell>{l.region}</TableCell>
                <TableCell>{l.date}</TableCell>
                <TableCell className="text-right">{l.liters.toFixed(0)}</TableCell>
                <TableCell className="text-right">{l.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">{l.linePrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {lines.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">No approved missions found for the selected period</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {lines.length > 0 && (
        <Card className="border-0 shadow-sm ml-auto max-w-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">{subtotal.toFixed(2)} SAR</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">VAT ({(vatRate * 100).toFixed(0)}%)</span><span className="font-medium">{vat.toFixed(2)} SAR</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-primary">{total.toFixed(2)} SAR</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
