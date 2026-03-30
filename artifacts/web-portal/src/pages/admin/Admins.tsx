import { useState } from "react";
import { useListAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AdminForm = { name: string; username: string; email: string; password: string; position: string };
const emptyForm: AdminForm = { name: "", username: "", email: "", password: "", position: "User" };

export default function AdminsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const { data: admins = [], refetch } = useListAdmins();
  const createMutation = useCreateAdmin();
  const updateMutation = useUpdateAdmin();
  const deleteMutation = useDeleteAdmin();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(emptyForm);

  const filtered = admins.filter((a) =>
    a.name?.toLowerCase().includes(query.toLowerCase()) ||
    a.username?.toLowerCase().includes(query.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ name: a.name, username: a.username, email: a.email || "", password: "", position: a.position || "User" });
    setDialogOpen(true);
  };

  const onSave = async () => {
    if (editId !== null) {
      const data: any = { name: form.name, username: form.username, email: form.email, position: form.position };
      if (form.password) data.password = form.password;
      await updateMutation.mutateAsync({ id: editId, data });
    } else {
      await createMutation.mutateAsync({ data: form });
    }
    setDialogOpen(false);
    refetch();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this admin?")) return;
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
          <p className="text-slate-500 mt-1">Manage system administrators</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate} className="bg-primary text-white gap-2">
            <Plus className="w-4 h-4" /> Add Admin
          </Button>
        )}
      </div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <Input placeholder="Search admins..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
      </CardContent></Card>
      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Position</TableHead>{isSuperAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a, i) => (
              <TableRow key={a.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-semibold">{a.name}</TableCell>
                <TableCell>{a.username}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>
                  <Badge className={a.position === "Admin" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"}>
                    {a.position}
                  </Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(a.id!)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No admins found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Admin" : "Add Admin"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Password {editId && "(leave blank to keep current)"}</Label><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
            <div><Label>Position</Label>
              <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={!form.name || !form.username || (!editId && !form.password)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
