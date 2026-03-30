import { useState } from "react";
import { useListTechnicians, useCreateTechnician, useUpdateTechnician, useDeleteTechnician } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ZONES = ["Mobily East Region", "COW East Region", "Mobily Central Region", "COW Central Region"];

type TechnicianForm = { name: string; phone: string; email: string; zone: string; active: boolean };
const emptyForm: TechnicianForm = { name: "", phone: "", email: "", zone: "", active: true };

export default function TechniciansPage() {
  const { data: technicians = [], refetch } = useListTechnicians();
  const createMutation = useCreateTechnician();
  const updateMutation = useUpdateTechnician();
  const deleteMutation = useDeleteTechnician();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TechnicianForm>(emptyForm);

  const filtered = technicians.filter((t) => t.name?.toLowerCase().includes(query.toLowerCase()));

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({ name: t.name, phone: t.phone || "", email: t.email || "", zone: t.zone || "", active: t.active !== false });
    setDialogOpen(true);
  };

  const onSave = async () => {
    if (editId !== null) {
      await updateMutation.mutateAsync({ id: editId, data: form });
    } else {
      await createMutation.mutateAsync({ data: form });
    }
    setDialogOpen(false);
    refetch();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this technician?")) return;
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Technicians</h1>
          <p className="text-slate-500 mt-1">Manage technical staff</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white gap-2">
          <Plus className="w-4 h-4" /> Add Technician
        </Button>
      </div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <Input placeholder="Search technicians..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
      </CardContent></Card>
      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Zone</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t, i) => (
              <TableRow key={t.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-semibold">{t.name}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.zone}</TableCell>
                <TableCell>
                  <Badge className={t.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    {t.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(t.id!)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">No technicians found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Technician" : "Add Technician"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Zone</Label>
              <Select value={form.zone} onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}>
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
