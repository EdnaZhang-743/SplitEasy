import { useState, type FormEvent } from "react";
import type { Person, Expense, NewExpense } from "../types";
import { splitExpenseShares } from "../logic/settlement";
import { formatCurrency } from "../utils/currency";
import { useExpenseFormState } from "../hooks/useExpenseFormState";
import ExpenseFields from "./ExpenseFields";

interface ExpenseListProps {
  expenses: Expense[];
  people: Person[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, expense: NewExpense) => void;
  onToggleCompleted: (id: string) => void;
}

interface ExpenseRowProps {
  expense: Expense;
  people: Person[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, expense: NewExpense) => void;
  onToggleCompleted: (id: string) => void;
}

function ExpenseRow({ expense, people, onRemove, onUpdate, onToggleCompleted }: ExpenseRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  const form = useExpenseFormState(people, expense);

  // Expenses may reference a person id that no longer exists in `people` —
  // this can only happen from data created before this version of the app
  // (an older hard-delete). Their name is gone for good, but we can at
  // least label it clearly instead of a bare "Unknown", and avoid letting
  // an edit silently reassign payer/participants since the form has no way
  // to represent "this missing person" as an option.
  const hasMissingPerson =
    !nameById.has(expense.paidBy) || expense.participants.some((id) => !nameById.has(id));

  function nameFor(id: string): string {
    return nameById.get(id) ?? "Former member (removed before this was tracked)";
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const updated = form.validate();
    if (!updated) return;
    onUpdate(expense.id, updated);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="expense-row">
        <form className="expense-form" onSubmit={handleSubmit}>
          <ExpenseFields
            idPrefix={`edit-${expense.id}`}
            people={people}
            description={form.description}
            onDescriptionChange={form.setDescription}
            amount={form.amount}
            onAmountChange={form.setAmount}
            paidBy={form.paidBy}
            onPaidByChange={form.setPaidBy}
            participantIds={form.participantIds}
            onToggleParticipant={form.toggleParticipant}
            error={form.error}
            submitLabel="Save changes"
            onCancel={() => setIsEditing(false)}
          />
        </form>
      </li>
    );
  }

  const shares = splitExpenseShares(expense);

  return (
    <li className={expense.completed ? "expense-row expense-row--completed" : "expense-row"}>
      <div className="expense-row__main">
        <span className="expense-row__description">{expense.description}</span>
        <span className="expense-row__amount">{formatCurrency(expense.amount)}</span>
      </div>
      <div className="expense-row__meta">
        <span>
          Paid by <strong>{nameFor(expense.paidBy)}</strong>
        </span>
      </div>
      <ul className="expense-row__shares">
        {expense.participants.map((id) => (
          <li key={id} className="expense-row__share">
            <span>{nameFor(id)}</span>
            <span>{formatCurrency(shares.get(id) ?? 0)}</span>
          </li>
        ))}
      </ul>
      {hasMissingPerson && (
        <p className="expense-row__warning">
          Someone in this expense was removed before name history was kept, so editing is
          disabled to avoid reassigning their share to someone else.
        </p>
      )}
      <div className="expense-row__footer">
        <div className="expense-row__actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setIsEditing(true)}
            disabled={hasMissingPerson}
            aria-label={`Edit ${expense.description}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => onRemove(expense.id)}
            aria-label={`Remove ${expense.description}`}
          >
            Remove
          </button>
        </div>
        <label className="completed-toggle">
          <input
            type="checkbox"
            checked={expense.completed}
            onChange={() => onToggleCompleted(expense.id)}
          />
          Settled
        </label>
      </div>
    </li>
  );
}

export default function ExpenseList({
  expenses,
  people,
  onRemove,
  onUpdate,
  onToggleCompleted,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <section className="card">
        <h2>Expenses</h2>
        <p className="empty-hint">No expenses yet. Add one above to see it here.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Expenses</h2>
      <ul className="expense-list">
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            people={people}
            onRemove={onRemove}
            onUpdate={onUpdate}
            onToggleCompleted={onToggleCompleted}
          />
        ))}
      </ul>
    </section>
  );
}
