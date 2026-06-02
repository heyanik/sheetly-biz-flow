import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gas, type Job, type Fabric } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Printing Jobs — Textile ERP" }] }),
  component: JobsPage,
});

function today() { return new Date().toISOString().slice(0, 10); }

function JobsPage() {
  const qc = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => gas<Job[]>("listJobs") });
  const { data: fabrics = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => gas<Fabric[]>("listInventory") });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), fabric_id: "", yards_printed: "", ink_used_ml: "", ink_cost_per_ml: "" });

  const selected = fabrics.find(f => f.fabric_id === form.fabric_id);

  const addMut = useMutation({
    mutationFn: () => gas("addJob", {
      ...form,
      yards_printed: Number(form.yards_printed),
      ink_used_ml: Number(form.ink_used_ml),
      ink_cost_per_ml: Number(form.ink_cost_per_ml),
    }),
    onSuccess: (d: any) => {
      toast.success(`Job ${d.job_id} logged · Ink cost ${d.total_ink_cost}`);
      setOpen(false);
      setForm({ date: today(), fabric_id: "", yards_printed: "", ink_used_ml: "", ink_cost_per_ml: "" });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Printing Jobs"
        description="Logging a job auto-deducts fabric stock and computes ink cost."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Log Job</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Printing Job</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div>
                  <Label>Fabric Lot</Label>
                  <Select value={form.fabric_id} onValueChange={v => setForm({ ...form, fabric_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose fabric" /></SelectTrigger>
                    <SelectContent>
                      {fabrics.map(f => (
                        <SelectItem key={f.fabric_id} value={f.fabric_id}>
                          {f.fabric_id} · {f.client_name} · {f.fabric_type} ({f.current_stock_yards} yd left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected && <div className="text-xs text-muted-foreground mt-1">Available: {selected.current_stock_yards} yards</div>}
                </div>
                <div><Label>Yards to Print</Label><Input type="number" value={form.yards_printed} onChange={e => setForm({ ...form, yards_printed: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Ink Used (ml)</Label><Input type="number" value={form.ink_used_ml} onChange={e => setForm({ ...form, ink_used_ml: e.target.value })} /></div>
                  <div><Label>Cost / ml</Label><Input type="number" value={form.ink_cost_per_ml} onChange={e => setForm({ ...form, ink_cost_per_ml: e.target.value })} /></div>
                </div>
                {form.ink_used_ml && form.ink_cost_per_ml && (
                  <div className="text-sm">Total ink cost: <b>{(Number(form.ink_used_ml) * Number(form.ink_cost_per_ml)).toLocaleString()}</b></div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => addMut.mutate()} disabled={!form.fabric_id || !form.yards_printed || addMut.isPending}>
                  {addMut.isPending ? "Saving…" : "Save Job"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-8">
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead><TableHead>Date</TableHead><TableHead>Fabric</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Yards</TableHead>
                <TableHead className="text-right">Ink (ml)</TableHead>
                <TableHead className="text-right">Ink Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
              {!isLoading && jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No jobs logged yet.</TableCell></TableRow>}
              {jobs.slice().reverse().map(j => (
                <TableRow key={j.job_id}>
                  <TableCell className="font-mono text-xs">{j.job_id}</TableCell>
                  <TableCell>{String(j.date).slice(0, 10)}</TableCell>
                  <TableCell className="font-mono text-xs">{j.fabric_id}</TableCell>
                  <TableCell>{j.client_name}</TableCell>
                  <TableCell className="text-right">{Number(j.yards_printed).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(j.ink_used_ml).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{Number(j.total_ink_cost).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}