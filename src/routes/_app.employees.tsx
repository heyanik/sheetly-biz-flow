import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { gas, type Employee } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Banknote, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees — Textile ERP" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: () => gas<Employee[]>("listEmployees") });
  const [open, setOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", role: "", base_salary: "" });
  const [advAmount, setAdvAmount] = useState("");

  const addMut = useMutation({
    mutationFn: () => gas("addEmployee", { ...form, base_salary: Number(form.base_salary) }),
    onSuccess: () => {
      toast.success("Employee added");
      setOpen(false); setForm({ name: "", role: "", base_salary: "" });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const advMut = useMutation({
    mutationFn: () => gas("addEmployeeAdvance", { emp_id: advOpen!.emp_id, amount: Number(advAmount) }),
    onSuccess: () => {
      toast.success("Advance recorded");
      setAdvOpen(null); setAdvAmount("");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (emp_id: string) => gas("deleteEmployee", { emp_id }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage staff, roles, salaries, and advances."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Employee</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Printer, Operator, etc." /></div>
                <div><Label>Base Salary (monthly)</Label><Input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => addMut.mutate()} disabled={!form.name || addMut.isPending}>
                  {addMut.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-8">
        <div className="rounded-md border bg-card max-h-[70vh] overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-card [&_thead]:z-10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead>
                <TableHead className="text-right">Base Salary</TableHead>
                <TableHead className="text-right">Adv. Given</TableHead>
                <TableHead className="text-right">Adv. Deducted</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
              {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No employees yet.</TableCell></TableRow>}
              {data.map((e) => {
                const outstanding = Number(e.total_advance_given || 0) - Number(e.total_advance_deducted || 0);
                return (
                  <TableRow key={e.emp_id}>
                    <TableCell className="font-mono text-xs">{e.emp_id}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.role}</TableCell>
                    <TableCell className="text-right">{Number(e.base_salary).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(e.total_advance_given).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(e.total_advance_deducted).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{outstanding.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setAdvOpen(e)}><Banknote className="size-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${e.name}?`)) delMut.mutate(e.emp_id); }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!advOpen} onOpenChange={(o) => !o && setAdvOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Give Advance — {advOpen?.name}</DialogTitle></DialogHeader>
          <div>
            <Label>Amount</Label>
            <Input type="number" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => advMut.mutate()} disabled={!advAmount || advMut.isPending}>
              {advMut.isPending ? "Saving…" : "Record Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}