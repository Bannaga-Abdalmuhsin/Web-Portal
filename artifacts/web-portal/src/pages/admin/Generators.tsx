import { useState } from "react";
import { useListGenerators, useCreateGenerator, useUpdateGenerator, useDeleteGenerator } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

type GeneratorForm = {
  name: string;
  site: string;
  dailyVirtual: number;
  lastAvg: number;
  rateOk: boolean;
  active: boolean;
};

const emptyForm: GeneratorForm = { name: "", site: "", dailyVirtual: 0, lastAvg: 0, rateOk: true, active: true };

export default function GeneratorsPage() {
  const { data: generators = [], refetch } = useListGenerators();
  const createMutation = useCreateGenerator();
  const updateMutation = useUpdateGenerator();
  const deleteMutation = useDeleteGenerator();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<GeneratorForm>(emptyForm);

  const filtered = generators.filter((g) =>
    g.name?.toLowerCase().includes(query.toLowerCase()) ||
    g.site?.toLowerCase().includes(query.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (g: any) => {
    setEditId(g.id);
    setForm({ name: g.name, site: g.site || "", dailyVirtual: g.dailyVirtual || 0, lastAvg: g.lastAvg || 0, rateOk: g.rateOk !== false, active: g.active !== false });
    setDialogOpen(true);
  };

  const onSave = async () => {
    if (editId !== null) {
      await updateMutation.mutateAsync({ id: editId, data: { name: form.name, site: form.site, dailyVirtual: form.dailyVirtual, lastAvg: form.lastAvg, rateOk: form.rateOk, active: form.active } });
    } else {
      await createMutation.mutateAsync({ data: { name: form.name, site: form.site, dailyVirtual: form.dailyVirtual, lastAvg: form.lastAvg, rateOk: form.rateOk, active: form.active } });
    }
    setDialogOpen(false);
    refetch();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this generator?")) return;
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Generators</h1>
          <p className="text-slate-500 mt-1">Manage generator assets across all sites</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white gap-2">
          <Plus className="w-4 h-4" /> Add Generator
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search generators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Daily Virtual (L)</TableHead>
              <TableHead>Last Avg (L)</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((g, i) => (
              <TableRow key={g.id}>
                <TableCell className="text-slate-500">{i + 1}</TableCell>
                <TableCell className="font-semibold">{g.name}</TableCell>
                <TableCell>{g.site}</TableCell>
                <TableCell>{g.dailyVirtual}</TableCell>
                <TableCell>{g.lastAvg}</TableCell>
                <TableCell>
                  {g.rateOk ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                </TableCell>
                <TableCell>
                  <Badge className={g.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    {g.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(g.id!)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">No generators found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Generator" : "Add Generator"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Site</Label><Input value={form.site} onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))} /></div>
            <div><Label>Daily Virtual Consumption (L)</Label><Input type="number" value={form.dailyVirtual} onChange={(e) => setForm((f) => ({ ...f, dailyVirtual: Number(e.target.value) }))} /></div>
            <div><Label>Last Average Consumption (L)</Label><Input type="number" value={form.lastAvg} onChange={(e) => setForm((f) => ({ ...f, lastAvg: Number(e.target.value) }))} /></div>
            <div className="flex items-center gap-3"><Label>Rate OK</Label><Switch checked={form.rateOk} onCheckedChange={(v) => setForm((f) => ({ ...f, rateOk: v }))} /></div>
            <div className="flex items-center gap-3"><Label>Active</Label><Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={!form.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
