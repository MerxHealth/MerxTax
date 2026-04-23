/**
 * MerxTax — UK Self-Employed Tax Utilities
 * All calculations based on 2024-25 / 2025-26 HMRC rates
 * Used by: Dashboard, REDITUS, VIGIL, FACTURA, Sidebar
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const PERSONAL_ALLOWANCE   = 12_570;  // Income tax personal allowance
const BASIC_RATE_LIMIT     = 50_270;  // Upper limit of basic rate band
const BASIC_RATE           = 0.20;
const HIGHER_RATE          = 0.40;
const CLASS4_LOWER         = 12_570;  // Class 4 NI lower profits limit
const CLASS4_UPPER         = 50_270;  // Class 4 NI upper profits limit
const CLASS4_MAIN_RATE     = 0.06;    // 6% on profits between lower and upper
const CLASS4_HIGHER_RATE   = 0.02;    // 2% on profits above upper

// ── Tax Calculation ────────────────────────────────────────────────────────────

export interface UKTaxBreakdown {
  incomeTax: number;   // Income Tax liability
  class4NI:  number;   // Class 4 National Insurance
  totalTax:  number;   // Combined liability (what to show as "Tax Due")
}

/**
 * Calculate UK self-employed tax + Class 4 NI on net profit.
 * Assumes cash basis accounting (correct for sole traders under £150k).
 * Does NOT apply the trading allowance — if the user is tracking expenses
 * in REDITUS they are using the actual expenses method, which is mutually
 * exclusive with the trading allowance.
 */
export function calcUKSelfEmployedTax(netProfit: number): UKTaxBreakdown {
  if (netProfit <= 0) return { incomeTax: 0, class4NI: 0, totalTax: 0 };

  // Income Tax
  const taxableIncome  = Math.max(0, netProfit - PERSONAL_ALLOWANCE);
  const basicBand      = Math.min(taxableIncome, BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE);
  const higherBand     = Math.max(0, taxableIncome - (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE));
  const incomeTax      = basicBand * BASIC_RATE + higherBand * HIGHER_RATE;

  // Class 4 National Insurance (self-employed only — Class 2 abolished Apr 2024)
  const class4Main     = Math.max(0, Math.min(netProfit, CLASS4_UPPER) - CLASS4_LOWER) * CLASS4_MAIN_RATE;
  const class4Higher   = Math.max(0, netProfit - CLASS4_UPPER) * CLASS4_HIGHER_RATE;
  const class4NI       = class4Main + class4Higher;

  return {
    incomeTax: Math.round(incomeTax * 100) / 100,
    class4NI:  Math.round(class4NI  * 100) / 100,
    totalTax:  Math.round((incomeTax + class4NI) * 100) / 100,
  };
}

// ── Tax Year Helpers ───────────────────────────────────────────────────────────

/**
 * Returns the UK tax year string for a given date.
 * UK tax year runs 6 Apr – 5 Apr.
 * Format: "2026-27"
 */
export function calcUKTaxYear(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const afterTaxYearStart = m > 4 || (m === 4 && d >= 6);
  return afterTaxYearStart
    ? `${y}-${String(y + 1).slice(2)}`
    : `${y - 1}-${String(y).slice(2)}`;
}

/**
 * Returns the MTD quarter for a given date.
 * Q1: 6 Apr – 5 Jul
 * Q2: 6 Jul – 5 Oct
 * Q3: 6 Oct – 5 Jan
 * Q4: 6 Jan – 5 Apr
 */
export function calcUKQuarter(date: Date = new Date()): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const n = m * 100 + d;
  if (n >= 406 && n <= 705) return 'Q1';
  if (n >= 706 && n <= 1005) return 'Q2';
  if (n >= 1006 || n <= 105) return 'Q3';
  return 'Q4';
}

// ── Example (for reference, not used in production) ───────────────────────────
//
// Net profit: £13,490
// Personal allowance: £12,570
// Taxable income: £920
//
// Income Tax:  £920 × 20% = £184.00
// Class 4 NI:  £920 × 6%  = £55.20
// Total due:                £239.20
//
// (Previous code was showing only £184 — missing £55.20 in NI)
