import { useState } from "react";
import { useListDrivers, useCreateNotification, useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: drivers = [] } = useListDrivers();
  const { data: notifications = [], refetch } = useListNotifications();
  const createMutation = useCreateNotification();
  const [driverName, setDriverName] = useState("All");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        data: {
          title: title.trim(),
          message: message.trim(),
          driverName: driverName === "All" ? undefined : driverName,
          sentBy: user?.username || "Admin",
        }
      });
      setTitle("");
      setMessage("");
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 mt-1">Send push notifications to drivers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Send Notification</h2>
            <div>
              <Label>Send To</Label>
              <Select value={driverName} onValueChange={setDriverName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Drivers</SelectItem>
                  {drivers.filter(d => d.active).map((d) => (
                    <SelectItem key={d.id} value={d.name!}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter notification message..." rows={4} />
            </div>
            <Button onClick={onSubmit} disabled={submitting || !title.trim() || !message.trim()} className="w-full gap-2">
              <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <h2 className="font-semibold text-lg mb-4">Recent Notifications</h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Title</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.slice(0, 10).map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell>{n.driverName || "All"}</TableCell>
                    <TableCell>{n.sentBy}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                    </TableCell>
                  </TableRow>
                ))}
                {notifications.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No notifications sent yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
