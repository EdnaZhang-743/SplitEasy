/**
 * Settlement logic for the expense splitter.
 *
 * This module is intentionally framework-free: it takes plain data in,
 * returns plain data out, and has no React/DOM dependency. That makes it
 * trivial to unit test and easy to reason about independently of the UI.
 */

import type { Person, Expense, PersonBalance, Transaction, SettlementResult } from "../types";

const CENTS_PER_UNIT = 100;

// All internal math is done in integer cents to avoid floating point
// rounding errors (e.g. 0.1 + 0.2 !== 0.3 in JS floats).
function toCents(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT);
}

function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

/**
 * Splits an expense's amount across its participants as evenly as possible,
 * in integer cents. If the amount doesn't divide evenly, the leftover cents
 * are distributed one-by-one to the first participants (by id order) so the
 * total always reconciles exactly — no money is created or lost.
 */
function splitExpenseCents(expense: Expense): Map<string, number> {
  const participants = expense.participants ?? [];
  const n = participants.length;
  const shareMap = new Map<string, number>();

  if (n === 0) return shareMap;

  const totalCents = toCents(expense.amount);
  const baseShare = Math.floor(totalCents / n);
  let remainder = totalCents - baseShare * n;

  // Sort for deterministic, stable remainder distribution.
  const sorted = [...participants].sort();

  sorted.forEach((personId) => {
    let share = baseShare;
    if (remainder > 0) {
      share += 1;
      remainder -= 1;
    }
    shareMap.set(personId, share);
  });

  return shareMap;
}

/**
 * Public, currency-unit version of the per-expense split, for callers (like
 * the UI) that want to show exactly how much each participant owes for a
 * single expense — not just the overall net balance.
 *
 * Returns a Map<personId, shareAmount> in the same units as expense.amount.
 */
export function splitExpenseShares(expense: Expense): Map<string, number> {
  const centsMap = splitExpenseCents(expense);
  const shares = new Map<string, number>();
  for (const [personId, cents] of centsMap) {
    shares.set(personId, fromCents(cents));
  }
  return shares;
}

/**
 * Computes each person's net balance in cents.
 * Positive balance = this person is owed money overall.
 * Negative balance = this person owes money overall.
 */
export function calculateBalances(people: Person[], expenses: Expense[]): Map<string, number> {
  const balances = new Map<string, number>(people.map((p) => [p.id, 0]));

  for (const expense of expenses) {
    const amountCents = toCents(expense.amount);

    // Credit the payer for the full amount they fronted.
    if (balances.has(expense.paidBy)) {
      balances.set(expense.paidBy, balances.get(expense.paidBy)! + amountCents);
    }

    // Debit each participant for their share.
    const shares = splitExpenseCents(expense);
    for (const [personId, shareCents] of shares) {
      if (balances.has(personId)) {
        balances.set(personId, balances.get(personId)! - shareCents);
      }
    }
  }

  return balances;
}

/**
 * Turns net balances into a minimal list of settle-up transactions using a
 * greedy largest-debtor-to-largest-creditor matching. This does NOT
 * guarantee the absolute theoretical minimum number of transactions in
 * every edge case (that's a harder bin-packing-style problem), but it
 * produces a small, sensible set of payments in practice and runs in
 * O(n log n).
 */
export function calculateTransactions(balances: Map<string, number>): Transaction[] {
  // Work on a mutable copy in cents, ignoring near-zero noise.
  const THRESHOLD_CENTS = 1; // ignore sub-cent dust

  interface Party {
    personId: string;
    cents: number;
  }

  const creditors: Party[] = [];
  const debtors: Party[] = [];

  for (const [personId, cents] of balances) {
    if (cents > THRESHOLD_CENTS) creditors.push({ personId, cents });
    else if (cents < -THRESHOLD_CENTS) debtors.push({ personId, cents: -cents });
  }

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transactions: Transaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(debtor.cents, creditor.cents);

    if (settled > 0) {
      transactions.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: fromCents(settled),
      });
    }

    debtor.cents -= settled;
    creditor.cents -= settled;

    if (debtor.cents <= THRESHOLD_CENTS) i += 1;
    if (creditor.cents <= THRESHOLD_CENTS) j += 1;
  }

  return transactions.sort((a, b) => b.amount - a.amount);
}

/**
 * Convenience wrapper: given people + expenses, returns both the per-person
 * balances (as plain numbers, not cents) and the settle-up transactions.
 */
export function summarize(people: Person[], expenses: Expense[]): SettlementResult {
  const balancesCents = calculateBalances(people, expenses);
  const balances: PersonBalance[] = people.map((p) => ({
    personId: p.id,
    name: p.name,
    balance: fromCents(balancesCents.get(p.id) ?? 0),
  }));
  const transactions = calculateTransactions(balancesCents);

  return { balances, transactions };
}
