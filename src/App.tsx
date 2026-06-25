import { useMemo } from "react";
import { usePersistentState } from "./hooks/usePersistentState";
import Logo from "./components/Logo";
import PeopleManager from "./components/PeopleManager";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import SettlementSummary from "./components/SettlementSummary";
import { summarize } from "./logic/settlement";
import type { Person, Expense, NewExpense } from "./types";
import "./App.css";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

export default function App() {
  const [people, setPeople] = usePersistentState<Person[]>("expense-splitter:people", []);
  const [expenses, setExpenses] = usePersistentState<Expense[]>(
    "expense-splitter:expenses",
    [],
    // Older versions of this app stored expenses without a `completed`
    // field. Default them to not-yet-settled rather than leaving the field
    // undefined.
    (stored) => stored.map((e) => ({ ...e, completed: e.completed ?? false }))
  );

  function addPerson(name: string) {
    setPeople((prev) => [...prev, { id: nextId("person"), name }]);
  }

  /** A person can only be removed once no expense references them at all — as payer or participant — so removal never silently rewrites or breaks an existing expense. */
  function isPersonRemovable(id: string): boolean {
    return !expenses.some((e) => e.paidBy === id || e.participants.includes(id));
  }

  function removePerson(id: string) {
    if (!isPersonRemovable(id)) return;
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  function addExpense(expense: NewExpense) {
    setExpenses((prev) => [...prev, { id: nextId("expense"), ...expense, completed: false }]);
  }

  function updateExpense(id: string, updated: NewExpense) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  }

  function toggleExpenseCompleted(id: string) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    if (window.confirm("This will remove everyone and every expense. Continue?")) {
      setPeople([]);
      setExpenses([]);
    }
  }

  const { balances, transactions } = useMemo(
    () => summarize(people, expenses),
    [people, expenses]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          <Logo />
          {(people.length > 0 || expenses.length > 0) && (
            <button type="button" className="text-button start-over-button" onClick={clearAll}>
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="app-grid">
        <div className="app-column">
          <PeopleManager
            people={people}
            onAdd={addPerson}
            onRemove={removePerson}
            isRemovable={isPersonRemovable}
          />
          <ExpenseForm people={people} onAdd={addExpense} />
          <ExpenseList
            expenses={expenses}
            people={people}
            onRemove={removeExpense}
            onUpdate={updateExpense}
            onToggleCompleted={toggleExpenseCompleted}
          />
        </div>

        <div className="app-column">
          <SettlementSummary
            balances={balances}
            transactions={transactions}
            peopleCount={people.length}
          />
        </div>
      </main>
    </div>
  );
}
