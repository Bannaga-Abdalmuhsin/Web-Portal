import { useState } from "react";
import { useSites, useCreateSite, useDeleteSite } from "@/hooks/use-sites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  district: z.string().optional(),
  city: z.string().optional(),
  active: z.boolean().default(true),
});

export default function Sites() {
  const { data: sites, isLoading } = useSites();
  const createMutation = useCreateSite();
  const deleteMutation = useDeleteSite();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      district: "",
      city: "",
      active: true,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: { ...values, project: "stc COW" } }, {
      onSuccess: () => {
        toast({ title: "Site created successfully" });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to create site", variant: "destructive" })
    });
  };

  const filteredSites = sites?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            placeholder="Search sites by name or city..." 
            className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] p-6 rounded-3xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-display text-slate-900">Add New Site</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name / ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. COW531" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Riyadh" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District / Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Central" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-base shadow-lg shadow-primary/20" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Save Site"}
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
              <TableHead className="font-semibold text-slate-600 h-12">Site Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Location</TableHead>
              <TableHead className="font-semibold text-slate-600">Current Liters</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">Loading sites...</TableCell>
              </TableRow>
            ) : filteredSites?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <MapPin className="w-8 h-8 mb-2 opacity-50" />
                    <p>No sites found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSites?.map((site) => (
                <TableRow key={site.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="font-medium text-slate-900">{site.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{site.city || '-'}</div>
                    <div className="text-xs text-slate-500">{site.district}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{site.currentLiters || 0} L</TableCell>
                  <TableCell>
                    {site.active !== false ? (
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      onClick={() => {
                        if (confirm('Delete this site?')) {
                          deleteMutation.mutate({ id: site.id }, {
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
