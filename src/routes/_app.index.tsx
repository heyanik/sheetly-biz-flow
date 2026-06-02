import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { gas, type DashboardStats } from "@/lib/gas";
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Package, Droplet, Printer, Scissors } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — Textile ERP" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => gas<DashboardStats>("dashboard"),
    refetchInterval: 30_000,
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Live snapshot of today's operations." />
      <div className="p-8">
        {error && <div className="text-sm text-destructive mb-4">{(error as Error).message}</div>}
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Stat icon={UserCheck} label="Present Today" value={data.present_today} hint={`${data.absent_today} absent`} />
            <Stat icon={Users} label="Total Employees" value={data.employees_total} />
            <Stat icon={Package} label="Stock Remaining" value={`${data.total_stock_yards.toLocaleString()} yd`} />
            <Stat icon={Droplet} label="Ink Cost (This Month)" value={data.ink_cost_month.toLocaleString()} />
            <Stat icon={Scissors} label="Yards Printed (Month)" value={data.yards_printed_month.toLocaleString()} />
            <Stat icon={Printer} label="Jobs (Month)" value={data.jobs_month} />
          </div>
        )}
      </div>
    </>
  );
}