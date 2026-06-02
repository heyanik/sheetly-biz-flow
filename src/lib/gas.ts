const STORAGE_KEY = "gas_web_app_url";

export function getGasUrl(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setGasUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
}

export function clearGasUrl() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function gas<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const url = getGasUrl();
  if (!url) throw new Error("Google Apps Script URL not configured. Go to /setup.");
  const res = await fetch(url, {
    method: "POST",
    // text/plain avoids CORS preflight; GAS reads e.postData.contents
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");
  return json.data as T;
}

export type Employee = {
  emp_id: string;
  name: string;
  role: string;
  base_salary: number;
  total_advance_given: number;
  total_advance_deducted: number;
};

export type AttendanceRow = {
  date: string;
  emp_id: string;
  status: "Present" | "Absent" | "Half-Day" | "Overtime" | string;
  remarks: string;
};

export type PayrollRow = {
  payroll_id: string;
  month_year: string;
  emp_id: string;
  days_worked: number;
  gross_salary: number;
  advance_deduction: number;
  net_salary: number;
  payment_status: "Pending" | "Paid" | string;
};

export type Fabric = {
  fabric_id: string;
  client_name: string;
  fabric_type: string;
  total_yards_received: number;
  total_yards_printed: number;
  current_stock_yards: number;
  cost_per_yard: number;
};

export type Job = {
  job_id: string;
  date: string;
  fabric_id: string;
  client_name: string;
  yards_printed: number;
  ink_used_ml: number;
  ink_cost_per_ml: number;
  total_ink_cost: number;
};

export type DashboardStats = {
  employees_total: number;
  present_today: number;
  absent_today: number;
  total_stock_yards: number;
  ink_cost_month: number;
  yards_printed_month: number;
  jobs_month: number;
};