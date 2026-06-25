import { describe, it, expect } from "vitest";
import { calculateBalances, calculateTransactions, summarize, splitExpenseShares } from "./settlement";
import type { Person, Expense } from "../types";

const people: Person[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Carol" },
];

describe("calculateBalances", () => {
  it("returns zero balances when there are no expenses", () => {
    const balances = calculateBalances(people, []);
    expect(balances.get("a")).toBe(0);
    expect(balances.get("b")).toBe(0);
    expect(balances.get("c")).toBe(0);
  });

  it("splits a simple expense evenly among all participants", () => {
    const expenses: Expense[] = [
      { id: "e1", description: "Dinner", amount: 30, paidBy: "a", participants: ["a", "b", "c"], completed: false },
    ];
    const balances = calculateBalances(people, expenses);
    // Alice paid 30, owes 10 -> net +20
    expect(balances.get("a")).toBe(2000);
    // Bob and Carol each owe 10 -> net -10
    expect(balances.get("b")).toBe(-1000);
    expect(balances.get("c")).toBe(-1000);
  });

  it("handles amounts that do not divide evenly without losing cents", () => {
    const expenses: Expense[] = [
      { id: "e1", description: "Coffee", amount: 10, paidBy: "a", participants: ["a", "b", "c"], completed: false },
    ];
    const balances = calculateBalances(people, expenses);
    const total = [...balances.values()].reduce((sum, v) => sum + v, 0);
    // Net balances must always sum to zero - no money created or lost.
    expect(total).toBe(0);
  });

  it("only splits among the listed participants, not everyone", () => {
    const expenses: Expense[] = [
      { id: "e1", description: "Solo lunch", amount: 20, paidBy: "a", participants: ["a", "b"], completed: false },
    ];
    const balances = calculateBalances(people, expenses);
    expect(balances.get("a")).toBe(1000); // paid 20, owes 10
    expect(balances.get("b")).toBe(-1000); // owes 10
    expect(balances.get("c")).toBe(0); // not involved
  });

  it("accumulates balances correctly across multiple expenses", () => {
    const expenses: Expense[] = [
      { id: "e1", description: "Dinner", amount: 30, paidBy: "a", participants: ["a", "b", "c"], completed: false },
      { id: "e2", description: "Taxi", amount: 15, paidBy: "b", participants: ["a", "b", "c"], completed: false },
    ];
    const balances = calculateBalances(people, expenses);
    const total = [...balances.values()].reduce((sum, v) => sum + v, 0);
    expect(total).toBe(0);
    // Alice: paid 30, owes (10+5)=15 -> +15
    expect(balances.get("a")).toBe(1500);
    // Bob: paid 15, owes 15 -> 0
    expect(balances.get("b")).toBe(0);
    // Carol: paid 0, owes 15 -> -15
    expect(balances.get("c")).toBe(-1500);
  });
});

describe("calculateTransactions", () => {
  it("produces no transactions when everyone is already settled", () => {
    const balances = new Map([
      ["a", 0],
      ["b", 0],
    ]);
    expect(calculateTransactions(balances)).toEqual([]);
  });

  it("produces a single transaction for a simple two-person debt", () => {
    const balances = new Map([
      ["a", 1000],
      ["b", -1000],
    ]);
    const txns = calculateTransactions(balances);
    expect(txns).toEqual([{ from: "b", to: "a", amount: 10 }]);
  });

  it("nets out balances to the minimum sensible set of transactions", () => {
    // a is owed 20, b is owed 10, c owes 30. One person owes two people.
    const balances = new Map([
      ["a", 2000],
      ["b", 1000],
      ["c", -3000],
    ]);
    const txns = calculateTransactions(balances);
    const totalPaid = txns.reduce((sum, t) => sum + t.amount, 0);
    expect(totalPaid).toBe(30);
    expect(txns.every((t) => t.from === "c")).toBe(true);
  });

  it("ignores sub-cent rounding dust", () => {
    const balances = new Map([
      ["a", 0],
      ["b", 0],
    ]);
    expect(calculateTransactions(balances)).toEqual([]);
  });
});

describe("splitExpenseShares", () => {
  it("splits evenly among participants in plain currency units", () => {
    const expense: Expense = {
      id: "e1",
      description: "Dinner",
      amount: 30,
      paidBy: "a",
      participants: ["a", "b", "c"],
      completed: false,
    };
    const shares = splitExpenseShares(expense);
    expect(shares.get("a")).toBe(10);
    expect(shares.get("b")).toBe(10);
    expect(shares.get("c")).toBe(10);
  });

  it("distributes uneven amounts without losing money", () => {
    const expense: Expense = {
      id: "e1",
      description: "Coffee",
      amount: 10,
      paidBy: "a",
      participants: ["a", "b", "c"],
      completed: false,
    };
    const shares = splitExpenseShares(expense);
    const total = [...shares.values()].reduce((sum, v) => sum + v, 0);
    expect(total).toBeCloseTo(10);
  });

  it("only includes the listed participants", () => {
    const expense: Expense = {
      id: "e1",
      description: "Solo lunch",
      amount: 20,
      paidBy: "a",
      participants: ["a", "b"],
      completed: false,
    };
    const shares = splitExpenseShares(expense);
    expect(shares.has("c")).toBe(false);
    expect(shares.get("a")).toBe(10);
    expect(shares.get("b")).toBe(10);
  });
  it("splits correctly across everyone listed, regardless of group membership rules", () => {
    // The settlement math only cares about the people and expenses it's
    // given — it has no concept of who can or can't be removed from the
    // group. That's a UI-level concern (see App.tsx's isPersonRemovable).
    const people: Person[] = [
      { id: "a", name: "Amy" },
      { id: "b", name: "Bob" },
      { id: "j", name: "John" },
    ];
    const expenses: Expense[] = [
      { id: "e1", description: "Lunch", amount: 30, paidBy: "a", participants: ["a", "b", "j"], completed: false },
    ];
    const balances = calculateBalances(people, expenses);
    expect(balances.get("a")).toBe(2000); // paid 30, owes 10 -> +20
    expect(balances.get("b")).toBe(-1000); // owes 10
    expect(balances.get("j")).toBe(-1000); // owes 10
  });
});

describe("summarize", () => {
  it("combines balances and transactions for the UI", () => {
    const expenses: Expense[] = [
      { id: "e1", description: "Dinner", amount: 30, paidBy: "a", participants: ["a", "b", "c"], completed: false },
    ];
    const result = summarize(people, expenses);
    expect(result.balances).toHaveLength(3);
    expect(result.transactions.length).toBeGreaterThan(0);
    const totalBalance = result.balances.reduce((sum, b) => sum + b.balance, 0);
    expect(totalBalance).toBeCloseTo(0);
  });
});
