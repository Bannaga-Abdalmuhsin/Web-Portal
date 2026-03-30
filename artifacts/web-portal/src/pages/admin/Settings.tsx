import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";

export default function SettingsPage() {
  const { data: settings, refetch } = useGetSettings();
  const updateMutation = useUpdateSettings();
  const [form, setForm] = useState({
    fuelUnitPrice: 0.63,
    vatRate: 0.15,
    supplierName: "",
    supplierAddress: "",
    invoicePrefix: "INV-SEC-",
    invoiceSequence: 1,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        fuelUnitPrice: settings.fuelUnitPrice ?? 0.63,
        vatRate: settings.vatRate ?? 0.15,
        supplierName: settings.supplierName ?? "",
        supplierAddress: settings.supplierAddress ?? "",
        invoicePrefix: settings.invoicePrefix ?? "INV-SEC-",
        invoiceSequence: settings.invoiceSequence ?? 1,
      });
    }
  }, [settings]);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ data: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure application settings</p>
      </div>

      <Card className="border-0 shadow-sm max-w-2xl">
        <CardContent className="p-6 space-y-6">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" /> General Settings
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fuel Unit Price (SAR/L)</Label>
              <Input type="number" step="0.01" value={form.fuelUnitPrice}
                onChange={(e) => setForm((f) => ({ ...f, fuelUnitPrice: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>VAT Rate (%)</Label>
              <Input type="number" step="0.01" value={(form.vatRate * 100).toFixed(0)}
                onChange={(e) => setForm((f) => ({ ...f, vatRate: Number(e.target.value) / 100 }))} />
            </div>
          </div>

          <div>
            <Label>Supplier Name</Label>
            <Input value={form.supplierName} onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))} />
          </div>

          <div>
            <Label>Supplier Address</Label>
            <Input value={form.supplierAddress} onChange={(e) => setForm((f) => ({ ...f, supplierAddress: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Prefix</Label>
              <Input value={form.invoicePrefix} onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value }))} />
            </div>
            <div>
              <Label>Invoice Sequence Start</Label>
              <Input type="number" value={form.invoiceSequence}
                onChange={(e) => setForm((f) => ({ ...f, invoiceSequence: Number(e.target.value) }))} />
            </div>
          </div>

          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
