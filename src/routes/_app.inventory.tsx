import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gas, type Fabric } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PackagePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Textile ERP" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => gas<Fabric[]>("listInventory") });
  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState<Fabric | null>(null);
  const [stockYards, setStockYards] = useState("");
  const [form, setForm] = useState({ client_name: "", fabric_type: "White", total_yards_received: "", cost_per_yard: "" });

  const addMut = useMutation({
    mutationFn: () => gas("addFabric", { ...form, total_yards_received: Number(form.total_yards_received), cost_per_yard: Number(form.cost_per_yard) }),
    onSuccess: () => { toast.success("Fabric added"); setOpen(false); setForm({ client_name: "", fabric_type: "White", total_yards_received: "", cost_per_yard: "" }); qc.invalidateQueries({ queryKey: ["inventory"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const restockMut = useMutation({
    mutationFn: () => gas("addFabricStock", { fabric_id: restock!.fabric_id, yards: Number(stockYards) }),
    onSuccess: () => { toast.success("Stock added"); setRestock(null); setStockYards(""); qc.invalidateQueries({ queryKey: ["inventory"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Fabric received, printed, and remaining stock per client."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Add Fabric</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Fabric Lot</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Client</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
                <div><Label>Type</Label><Input value={form.fabric_type} onChange={e => setForm({ ...form, fabric_type: e.target.value })} placeholder="White, Gray, etc." /></div>
                <div><Label>Yards Received</Label><Input type="number" value={form.total_yards_received} onChange={e => setForm({ ...form, total_yards_received: e.target.value })} /></div>
                <div><Label>Cost per Yard</Label><Input type="number" value={form.cost_per_yard} onChange={e => setForm({ ...form, cost_per_yard: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => addMut.mutate()} disabled={!form.client_name || !form.total_yards_received || addMut.isPending}>
                  {addMut.isPending ? "Saving…" : "Save"}
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
                <TableHead>ID</TableHead><TableHead>Client</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Printed</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Cost/Yd</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
              {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No fabric lots yet.</TableCell></TableRow>}
              {data.map(f => (
                <TableRow key={f.fabric_id}>
                  <TableCell className="font-mono text-xs">{f.fabric_id}</TableCell>
                  <TableCell className="font-medium">{f.client_name}</TableCell>
                  <TableCell>{f.fabric_type}</TableCell>
                  <TableCell className="text-right">{Number(f.total_yards_received).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(f.total_yards_printed).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{Number(f.current_stock_yards).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(f.cost_per_yard).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setRestock(f)}><PackagePlus className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!restock} onOpenChange={(o) => !o && setRestock(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stock — {restock?.fabric_id}</DialogTitle></DialogHeader>
          <div><Label>Yards to Add</Label><Input type="number" value={stockYards} onChange={e => setStockYards(e.target.value)} /></div>
          <DialogFooter>
            <Button onClick={() => restockMut.mutate()} disabled={!stockYards || restockMut.isPending}>
              {restockMut.isPending ? "Saving…" : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}