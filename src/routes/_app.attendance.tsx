import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { gas, type Employee, type AttendanceRow } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Textile ERP" }] }),
  component: AttendancePage,
});

const STATUSES = ["Present", "Absent", "Half-Day", "Overtime"] as const;

function today() { return new Date().toISOString().slice(0, 10); }

function AttendancePage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => gas<Employee[]>("listEmployees") });
  const { data: rows = [] } = useQuery({
    queryKey: ["attendance", date],
    queryFn: () => gas<AttendanceRow[]>("listAttendance", { date }),
  });

  const existing = useMemo(() => {
    const m: Record<string, AttendanceRow> = {};
    rows.forEach(r => { m[String(r.emp_id)] = r; });
    return m;
  }, [rows]);

  const [draft, setDraft] = useState<Record<string, { status: string; remarks: string }>>({});

  useEffect(() => {
    const d: Record<string, { status: string; remarks: string }> = {};
    employees.forEach(e => {
      const ex = existing[e.emp_id];
      d[e.emp_id] = { status: ex?.status || "Present", remarks: ex?.remarks || "" };
    });
    setDraft(d);
  }, [employees, existing]);

  const saveMut = useMutation({
    mutationFn: () => gas("bulkAddAttendance", {
      date,
      entries: employees.map(e => ({ emp_id: e.emp_id, status: draft[e.emp_id]?.status || "Absent", remarks: draft[e.emp_id]?.remarks || "" })),
    }),
    onSuccess: () => {
      toast.success("Attendance saved");
      qc.invalidateQueries({ queryKey: ["attendance", date] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Bulk-enter daily attendance from the gate guard log."
        action={
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || employees.length === 0}>
              {saveMut.isPending ? "Saving…" : "Save Attendance"}
            </Button>
          </div>
        }
      />
      <div className="p-8">
        {employees.length === 0 ? (
          <div className="text-sm text-muted-foreground">Add employees first.</div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => (
                  <TableRow key={emp.emp_id}>
                    <TableCell className="font-mono text-xs">{emp.emp_id}</TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell>
                      <Select
                        value={draft[emp.emp_id]?.status || "Present"}
                        onValueChange={(v) => setDraft(d => ({ ...d, [emp.emp_id]: { ...d[emp.emp_id], status: v } }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft[emp.emp_id]?.remarks || ""}
                        onChange={e => setDraft(d => ({ ...d, [emp.emp_id]: { ...d[emp.emp_id], remarks: e.target.value } }))}
                        placeholder="Optional"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}