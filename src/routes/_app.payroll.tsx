import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gas, type PayrollRow, type Employee } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Textile ERP" }] }),
  component: PayrollPage,
});

function currentMonth() { return new Date().toISOString().slice(0, 7); }

function PayrollPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const [advCap, setAdvCap] = useState("5000");

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => gas<Employee[]>("listEmployees") });
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["payroll", month],
    queryFn: () => gas<PayrollRow[]>("listPayroll", { month_year: month }),
  });

  const empMap: Record<string, Employee> = {};
  employees.forEach(e => { empMap[e.emp_id] = e; });

  const processMut = useMutation({
    mutationFn: () => gas("processPayroll", { month_year: month, advance_deduction_per_month: Number(advCap) }),
    onSuccess: (d: any) => {
      toast.success(`Processed ${d.created} payroll record(s)`);
      qc.invalidateQueries({ queryKey: ["payroll", month] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const payMut = useMutation({
    mutationFn: (payroll_id: string) => gas("markPayrollPaid", { payroll_id }),
    onSuccess: () => { toast.success("Marked paid"); qc.invalidateQueries({ queryKey: ["payroll", month] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Calculates from attendance, deducts allowable advance, tracks payment."
        action={
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Month</Label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">Max Advance Deduction</Label>
              <Input type="number" value={advCap} onChange={e => setAdvCap(e.target.value)} className="w-40" />
            </div>
            <Button onClick={() => processMut.mutate()} disabled={processMut.isPending}>
              {processMut.isPending ? "Processing…" : "Process Payroll"}
            </Button>
          </div>
        }
      />
      <div className="p-8">
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll ID</TableHead><TableHead>Employee</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Adv. Deduction</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
              {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payroll records for {month}. Click "Process Payroll".</TableCell></TableRow>}
              {rows.map(r => (
                <TableRow key={r.payroll_id}>
                  <TableCell className="font-mono text-xs">{r.payroll_id}</TableCell>
                  <TableCell className="font-medium">{empMap[r.emp_id]?.name || r.emp_id}</TableCell>
                  <TableCell className="text-right">{r.days_worked}</TableCell>
                  <TableCell className="text-right">{Number(r.gross_salary).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(r.advance_deduction).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{Number(r.net_salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={r.payment_status === "Paid" ? "default" : "secondary"}>{r.payment_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.payment_status !== "Paid" && (
                      <Button size="sm" variant="outline" onClick={() => payMut.mutate(r.payroll_id)}>Mark Paid</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}