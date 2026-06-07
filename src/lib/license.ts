// =============================================================
// Monthly license gate
// -------------------------------------------------------------
// The owner (you) hands a fresh password to each factory at the
// end of every month. On the last day of the month the app starts
// prompting for the NEXT month's password; if they cannot supply
// it, the app stays locked and unusable.
//
// To rotate / add codes: just edit MONTHLY_PASSWORDS below and
// redeploy. Keys are "YYYY-MM" (the month the code unlocks).
// =============================================================

export const MONTHLY_PASSWORDS: Record<string, string> = {
  "2026-06": "TX-JUN-2026",
  "2026-07": "TX-JUL-2026",
  "2026-08": "TX-AUG-2026",
  "2026-09": "TX-SEP-2026",
  "2026-10": "TX-OCT-2026",
  "2026-11": "TX-NOV-2026",
  "2026-12": "TX-DEC-2026",
  "2027-01": "TX-JAN-2027",
};

const STORAGE_KEY = "erp_license_unlocked_until"; // value: "YYYY-MM"

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastDayOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** The month (YYYY-MM) the app currently needs to be unlocked for.
 *  Normally the current month — but on the last calendar day of the
 *  month we already require the NEXT month's password. */
export function requiredMonth(now: Date = new Date()): string {
  if (now.getDate() === lastDayOfMonth(now)) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return ym(next);
  }
  return ym(now);
}

export function getUnlockedUntil(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function isUnlocked(now: Date = new Date()): boolean {
  const until = getUnlockedUntil();
  if (!until) return false;
  return until >= requiredMonth(now); // string compare works for YYYY-MM
}

/** Try to unlock with the given password. Returns true on success. */
export function tryUnlock(password: string, now: Date = new Date()): boolean {
  const month = requiredMonth(now);
  const expected = MONTHLY_PASSWORDS[month];
  if (!expected) return false;
  if (password.trim() !== expected) return false;
  localStorage.setItem(STORAGE_KEY, month);
  return true;
}

export function lockApp() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}