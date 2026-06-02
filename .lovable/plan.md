# ERP Revamp Plan

Big restructure across most modules. Here is exactly what I will build before I touch any code, so you can confirm the direction.

## 1. Dashboard
- Remove **Present Today** and **Jobs (Month)** cards.
- Rename **Ink Cost (This Month)** → **Ink Used (This Month)** (shows ml used this month).
- Add **Ink Remaining** card (total ml in stock from new Ink module).
- Keep layout flexible — cards rendered from a config array so adding more later is a one-line change.

## 2. Employees
- No change.

## 3. Attendance (rebuilt)
- Top bar: **Year picker** only (defaults to current year).
- Table of all employees with columns: **ID · Name · Role · Month (dropdown: Jan–Dec) · View**.
- Clicking **View** opens a per-employee monthly calendar dialog. Each day is a clickable cell that toggles Present / Absent / Half-Day / Overtime (cycle on click) with color coding.
- Save persists all marked days for that employee/month in one call. Designed for end-of-month bulk entry from the gate guard's handwritten sheet.
- Backend: extend `bulkAddAttendance` to accept `{emp_id, entries:[{date,status}]}` (upserts by date+emp).

## 4. Payroll (rebuilt)
- Top bar: **Year + Month** pickers and **Process Payroll** button.
- Process loads every employee with: ID, Name, Role, Base Salary, Days Worked (from attendance), Gross, **Advance Deduction (editable input per row)**, **Net Salary (auto = Gross − Advance)**, **Signature** column (empty box for hand-signing on the printed sheet).
- Buttons: **Save** (persists rows incl. manual deductions, updates employee advance ledger), **Print PDF**, **Export Excel**.
- PDF: company header, month/year, table with signature column, generated client-side via `jspdf` + `jspdf-autotable`. Excel via `xlsx`.

## 5. Inventory (revised)
- Top bar: **Year + Month** picker → filters fabrics by `received_date` within that month.
- "Add Client / Add Fabric" dialog fields: **Client Name, Fabric Type, Received Yards, Printed Yards (default 0)**. Remove Cost/yd entirely.
- Each row has an **Edit** button to update Printed Yards (and other fields) as printing progresses.
- Backend: add `received_date` column, drop cost_per_yard from UI (kept in schema for backward compat but hidden).

## 6. Printing Jobs → replaced by **Invoices**
- Remove Printing Jobs route and nav entry.
- New **Invoices** module:
  - Form: **Client (dropdown from Inventory clients) · Fabric Printed (yards) · Price (manual entry, total amount) · Date**.
  - On save: creates invoice, deducts yards from that client's fabric stock.
  - **Print Invoice (PDF)**: company logo background (watermark), invoice #, date, client, yards, amount, **two signature blocks (Client / Manager)**.
- Backend: new `Invoices` sheet (`invoice_id, date, client_name, fabric_id, yards_printed, total_amount`). New actions: `listInvoices`, `addInvoice`.

## 7. Ink (new module)
- Two tabs: **Add Ink** and **Ink Usage**.
- **Add Ink**: form (date, quantity_ml, rate_per_ml, supplier optional) + table of purchases. Computes total cost.
- **Ink Usage**: form (date, quantity_ml_used, job/note) + table grouped/summed by month. Shows monthly cost = used × avg rate.
- Dashboard pulls: **Ink Used this month (ml)** and **Ink Remaining (ml)** = total purchased − total used.
- Backend: two new sheets `Ink_Purchases` and `Ink_Usage`; actions `addInkPurchase`, `listInkPurchases`, `addInkUsage`, `listInkUsage`, plus dashboard fields `ink_used_month_ml`, `ink_remaining_ml`.

## Technical notes (backend `Code.gs`)
You will need to **re-paste the updated `Code.gs`** into your Apps Script editor and redeploy the Web App once I'm done (I'll output the full file). New/updated actions:
- `dashboard` → returns new shape (no `present_today`, no `jobs_month`; adds `ink_used_month_ml`, `ink_remaining_ml`).
- `bulkAddAttendance` → accepts per-employee monthly entries.
- `addFabric` → no cost_per_yard required; adds `received_date`.
- `updateFabric` → new (edit row).
- `addInvoice`, `listInvoices` → new sheet + actions.
- `addInkPurchase`, `listInkPurchases`, `addInkUsage`, `listInkUsage` → new sheets + actions.
- `processPayroll` → accepts manual `advance_deductions: {emp_id: amount}` map.
- Existing `addJob` / Printing_Jobs sheet kept in backend for backward compat but unused by frontend.

## Frontend new deps
- `jspdf`, `jspdf-autotable` (PDF generation for payroll + invoices)
- `xlsx` (Excel export for payroll)
- Logo asset for invoice background — I'll generate a simple placeholder textile-company logo; you can swap it later.

## Files
- Edit: `Code.gs`, `src/lib/gas.ts` (new types), `src/components/AppLayout.tsx` (nav: drop Jobs, add Invoices + Ink), `src/routes/_app.index.tsx`, `src/routes/_app.attendance.tsx`, `src/routes/_app.payroll.tsx`, `src/routes/_app.inventory.tsx`.
- New: `src/routes/_app.invoices.tsx`, `src/routes/_app.ink.tsx`, `src/lib/pdf.ts` (shared PDF helpers), `src/assets/logo.png`.
- Delete: `src/routes/_app.jobs.tsx`.

Confirm and I'll build it.
