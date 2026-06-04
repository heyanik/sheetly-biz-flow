import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { gas, type InkPurchase, type InkUsage } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { optimisticAppend, tempId } from "@/lib/optimistic";

export const Route = createFileRoute("/_app/ink")({
  head: () => ({ meta: [{ title: "Ink — Textile ERP" }] }),
  component: InkPage,
});

function today() { return new Date().toISOString().slice(0, 10); }
function ym(s: string) { return (s || "").slice(0, 7); }

function InkPage() {
  const qc = useQueryClient();
  const { data: purchases = [] } = useQuery({ queryKey: ["ink-purchases"], queryFn: () => gas<InkPurchase[]>("listInkPurchases") });
  const { data: usage = [] } = useQuery({ queryKey: ["ink-usage"], queryFn: () => gas<InkUsage[]>("listInkUsage") });

  const totalPurchasedMl = purchases.reduce((s, r) => s + Number(r.quantity_ml || 0), 0);
  const totalPurchasedCost = purchases.reduce((s, r) => s + Number(r.total_cost || 0), 0);
  const totalUsedMl = usage.reduce((s, r) => s + Number(r.quantity_ml || 0), 0);
  const remaining = totalPurchasedMl - totalUsedMl;
  const avgRate = totalPurchasedMl ? totalPurchasedCost / totalPurchasedMl : 0;

  const monthlyUsage = useMemo(() => {
    const m: Record<string, number> = {};
    usage.forEach(u => { m[ym(u.date)] = (m[ym(u.date)] || 0) + Number(u.quantity_ml || 0); });
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [usage]);

  const [pForm, setPForm] = useState({ date: today(), quantity_ml: "", rate_per_ml: "", supplier: "" });
  const [uForm, setUForm] = useState({ date: today(), quantity_ml: "", note: "" });

  const purchaseMut = useMutation({
    mutationFn: () => gas("addInkPurchase", { ...pForm, quantity_ml: Number(pForm.quantity_ml), rate_per_ml: Number(pForm.rate_per_ml) }),
    onMutate: async () => {
      const qty = Number(pForm.quantity_ml) || 0;
      const rate = Number(pForm.rate_per_ml) || 0;
      const optimistic: InkPurchase = {
        purchase_id: tempId("INKP"), date: pForm.date,
        quantity_ml: qty, rate_per_ml: rate, total_cost: qty * rate,
        supplier: pForm.supplier,
      };
      setPForm({ date: today(), quantity_ml: "", rate_per_ml: "", supplier: "" });
      toast.success("Ink purchase recorded");
      return await optimisticAppend<InkPurchase>(qc, ["ink-purchases"], optimistic);
    },
    onError: (e: any, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(["ink-purchases"], ctx.prev); toast.error(e.message); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["ink-purchases"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const usageMut = useMutation({
    mutationFn: () => gas("addInkUsage", { ...uForm, quantity_ml: Number(uForm.quantity_ml) }),
    onMutate: async () => {
      const optimistic: InkUsage = {
        usage_id: tempId("INKU"), date: uForm.date,
        quantity_ml: Number(uForm.quantity_ml) || 0, note: uForm.note,
      };
      setUForm({ date: today(), quantity_ml: "", note: "" });
      toast.success("Ink usage recorded");
      return await optimisticAppend<InkUsage>(qc, ["ink-usage"], optimistic);
    },
    onError: (e: any, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(["ink-usage"], ctx.prev); toast.error(e.message); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["ink-usage"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <>
      <PageHeader title="Ink" description="Track ink purchases and consumption." />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total Purchased</div><div className="text-2xl font-semibold">{totalPurchasedMl.toLocaleString()} ml</div><div className="text-xs text-muted-foreground mt-1">Cost: {totalPurchasedCost.toLocaleString()}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total Used</div><div className="text-2xl font-semibold">{totalUsedMl.toLocaleString()} ml</div><div className="text-xs text-muted-foreground mt-1">Avg rate: {avgRate.toFixed(2)} / ml</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-2xl font-semibold">{remaining.toLocaleString()} ml</div></CardContent></Card>
        </div>

        <Tabs defaultValue="purchase">
          <TabsList>
            <TabsTrigger value="purchase">Add Ink</TabsTrigger>
            <TabsTrigger value="usage">Ink Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-4">
            <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div><Label>Date</Label><Input type="date" value={pForm.date} onChange={e => setPForm({ ...pForm, date: e.target.value })} /></div>
                <div><Label>Quantity (ml)</Label><Input type="number" value={pForm.quantity_ml} onChange={e => setPForm({ ...pForm, quantity_ml: e.target.value })} /></div>
                <div><Label>Rate / ml</Label><Input type="number" value={pForm.rate_per_ml} onChange={e => setPForm({ ...pForm, rate_per_ml: e.target.value })} /></div>
                <div><Label>Supplier</Label><Input value={pForm.supplier} onChange={e => setPForm({ ...pForm, supplier: e.target.value })} /></div>
                <Button onClick={() => purchaseMut.mutate()} disabled={!pForm.quantity_ml || !pForm.rate_per_ml || purchaseMut.isPending}>
                  {purchaseMut.isPending ? "Saving…" : "Add Purchase"}
                </Button>
              </CardContent>
            </Card>
            <div className="rounded-md border bg-card max-h-[70vh] overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-card [&_thead]:z-10">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Qty (ml)</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader>
                <TableBody>
                  {purchases.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No purchases yet.</TableCell></TableRow>}
                  {purchases.slice().reverse().map(p => (
                    <TableRow key={p.purchase_id}>
                      <TableCell className="font-mono text-xs">{p.purchase_id}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.supplier || "—"}</TableCell>
                      <TableCell className="text-right">{Number(p.quantity_ml).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(p.rate_per_ml).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(p.total_cost).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div><Label>Date</Label><Input type="date" value={uForm.date} onChange={e => setUForm({ ...uForm, date: e.target.value })} /></div>
                <div><Label>Quantity Used (ml)</Label><Input type="number" value={uForm.quantity_ml} onChange={e => setUForm({ ...uForm, quantity_ml: e.target.value })} /></div>
                <div><Label>Note</Label><Input value={uForm.note} onChange={e => setUForm({ ...uForm, note: e.target.value })} /></div>
                <Button onClick={() => usageMut.mutate()} disabled={!uForm.quantity_ml || usageMut.isPending}>
                  {usageMut.isPending ? "Saving…" : "Add Usage"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border bg-card max-h-[70vh] overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-card [&_thead]:z-10">
                <div className="px-4 py-3 border-b text-sm font-medium">Monthly Cost (using avg rate {avgRate.toFixed(2)}/ml)</div>
                <Table>
                  <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Used (ml)</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {monthlyUsage.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No usage yet.</TableCell></TableRow>}
                    {monthlyUsage.map(([m, qty]) => (
                      <TableRow key={m}>
                        <TableCell>{m}</TableCell>
                        <TableCell className="text-right">{qty.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">{Math.round(qty * avgRate).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="rounded-md border bg-card max-h-[70vh] overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-card [&_thead]:z-10">
                <div className="px-4 py-3 border-b text-sm font-medium">Recent Usage</div>
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {usage.slice().reverse().slice(0, 20).map(u => (
                      <TableRow key={u.usage_id}>
                        <TableCell>{u.date}</TableCell>
                        <TableCell className="text-right">{Number(u.quantity_ml).toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{u.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}