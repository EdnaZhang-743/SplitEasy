/**
 * Shared domain types for the expense splitter. Kept in one place so the
 * settlement logic and the UI components agree on the exact same shapes.
 */

export interface Person {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  /** Total amount paid, in normal currency units (e.g. dollars), not cents. */
  amount: number;
  /** Person id of whoever fronted the money. */
  paidBy: string;
  /** Person ids sharing this expense. */
  participants: string[];
  /** Whether this expense has been marked settled/reimbursed. */
  completed: boolean;
}

/** A new expense before it's been assigned an id. */
export type NewExpense = Omit<Expense, "id">;

export interface PersonBalance {
  personId: string;
  name: string;
  /** Positive = owed money overall. Negative = owes money overall. */
  balance: number;
}

export interface Transaction {
  /** Person id who needs to pay. */
  from: string;
  /** Person id who should receive the payment. */
  to: string;
  amount: number;
}

export interface SettlementResult {
  balances: PersonBalance[];
  transactions: Transaction[];
}
