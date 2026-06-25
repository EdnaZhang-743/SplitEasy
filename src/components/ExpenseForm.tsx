import type { FormEvent } from "react";
import type { Person, NewExpense } from "../types";
import { useExpenseFormState } from "../hooks/useExpenseFormState";
import ExpenseFields from "./ExpenseFields";

interface ExpenseFormProps {
  people: Person[];
  onAdd: (expense: NewExpense) => void;
}

export default function ExpenseForm({ people, onAdd }: ExpenseFormProps) {
  const form = useExpenseFormState(people);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const expense = form.validate();
    if (!expense) return;
    onAdd(expense);
    form.reset();
  }

  if (people.length < 2) {
    return (
      <section className="card">
        <h2>Add an expense</h2>
        <p className="empty-hint">Add at least two people before recording an expense.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Add an expense</h2>
      <form className="expense-form" onSubmit={handleSubmit}>
        <ExpenseFields
          idPrefix="add-expense"
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
          submitLabel="Add expense"
        />
      </form>
    </section>
  );
}
