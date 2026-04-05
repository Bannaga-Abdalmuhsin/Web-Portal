import { useState } from "react";
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from "@/hooks/use-drivers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Users, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  zone: z.string().optional(),
  active: z.boolean().default(true),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
});

export default function Drivers() {
  const { data: drivers, isLoading } = useDrivers();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();
  const { toast } = useToast();

  const defaultDriverValues = { name: "", phone: "", email: "", zone: "", active: true, password: "" };

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultDriverValues,
  });

  const openCreate = () => {
    form.reset(defaultDriverValues);
    setEditDriverId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (driver: any) => {
    form.reset({
      name: driver.name,
      phone: driver.phone || "",
      email: driver.email || "",
      zone: driver.zone || "",
      active: driver.active,
      password: "",
    });
    setEditDriverId(driver.id);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editDriverId !== null) {
      updateMutation.mutate({ id: editDriverId, data: values }, {
        onSuccess: () => {
          toast({ title: "Driver updated" });
          setIsDialogOpen(false);
          setEditDriverId(null);
        },
        onError: () => toast({ title: "Failed to update driver", variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Driver added successfully" });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => toast({ title: "Failed to add driver", variant: "destructive" }),
      });
    }
  };

  const filteredDrivers = drivers?.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            placeholder="Search drivers by name or zone..." 
            className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all" onClick={openCreate}>
          <Plus className="w-5 h-5 mr-2" />
          Add Driver
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) { setIsDialogOpen(false); setEditDriverId(null); } }}>
          <DialogContent className="sm:max-w-[420px] p-6 rounded-3xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display text-slate-900">{editDriverId ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (For Login)</FormLabel>
                      <FormControl>
                        <Input placeholder="driver@aces.com" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +966 50 000 0000" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Central Region" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-100 p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Account</FormLabel>
                        <div className="text-sm text-slate-500">Allow driver to login</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-base shadow-lg shadow-primary/20" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editDriverId ? "Update Driver" : "Save Driver")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-panel border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-600 h-12">Driver Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Contact</TableHead>
              <TableHead className="font-semibold text-slate-600">Zone</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">Loading drivers...</TableCell>
              </TableRow>
            ) : filteredDrivers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <p>No drivers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers?.map((driver) => (
                <TableRow key={driver.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="font-medium text-slate-900">{driver.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{driver.email || '-'}</div>
                    <div className="text-xs text-slate-500">{driver.phone || '-'}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{driver.zone || '-'}</TableCell>
                  <TableCell>
                    {driver.active ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg text-sm font-medium">
                        <XCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        onClick={() => openEdit(driver)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => {
                          if (confirm('Delete this driver?')) {
                            deleteMutation.mutate({ id: driver.id }, {
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
    </div>
  );
}
