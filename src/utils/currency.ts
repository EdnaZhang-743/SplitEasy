/**
 * Centralized currency formatting so the whole app agrees on one currency
 * and locale. Change CURRENCY here to switch the entire app at once.
 */
const CURRENCY = "NZD";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY }).format(
    amount
  );
}
