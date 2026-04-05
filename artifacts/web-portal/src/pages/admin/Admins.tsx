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
import { Plus, Pencil, Trash2, ShieldCheck, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AdminForm = { name: string; username: string; email: string; password: string; position: string; role: string };
const emptyForm: AdminForm = { name: "", username: "", email: "", password: "", position: "Admin", role: "superadmin" };

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Admin", color: "bg-primary/10 text-primary border-primary/20" },
  supervisor: { label: "Region Supervisor", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

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
    setForm({ name: a.name, username: a.username, email: a.email || "", password: "", position: a.position || "Admin", role: a.role || "superadmin" });
    setDialogOpen(true);
  };

  const onSave = async () => {
    if (editId !== null) {
      const data: any = { name: form.name, username: form.username, email: form.email, position: form.position, role: form.role };
      if (form.password) data.password = form.password;
      await updateMutation.mutateAsync({ id: editId, data });
    } else {
      await createMutation.mutateAsync({ data: form });
    }
    setDialogOpen(false);
    refetch();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
          <p className="text-slate-500 mt-1">Manage administrators and region supervisors</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate} className="bg-primary text-white gap-2">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <Input placeholder="Search by name or username..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
      </CardContent></Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isSuperAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a, i) => {
              const roleCfg = ROLE_CONFIG[(a as any).role || "superadmin"] ?? ROLE_CONFIG.superadmin;
              return (
                <TableRow key={a.id}>
                  <TableCell className="text-slate-500">{i + 1}</TableCell>
                  <TableCell className="font-semibold">{a.name}</TableCell>
                  <TableCell>{a.username}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-medium ${roleCfg.color}`}>
                      {(a as any).role === "supervisor"
                        ? <><UserCog className="w-3 h-3 mr-1 inline" />Region Supervisor</>
                        : <><ShieldCheck className="w-3 h-3 mr-1 inline" />Admin</>
                      }
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
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Password {editId && "(leave blank to keep current)"}</Label><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v, position: v === "supervisor" ? "Supervisor" : "Admin" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Admin</div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="flex items-center gap-2"><UserCog className="w-4 h-4 text-amber-600" />Region Supervisor</div>
                  </SelectItem>
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
