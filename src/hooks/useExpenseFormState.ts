import { useEffect, useState } from "react";
import type { Person, NewExpense, Expense } from "../types";

/**
 * Manages the form state for an expense (description, amount, payer,
 * participants), shared between "add a new expense" and "edit an existing
 * expense". Optionally seeded with an existing expense's values for editing.
 *
 * Participants default to "just the payer" (never empty, but also never
 * silently assuming everyone is involved) and update to follow the payer
 * selection until the user manually touches a checkbox themselves.
 */
export function useExpenseFormState(people: Person[], seed?: Expense) {
  const [description, setDescription] = useState(seed?.description ?? "");
  const [amount, setAmount] = useState(seed ? String(seed.amount) : "");
  const [paidBy, setPaidBy] = useState(seed?.paidBy ?? people[0]?.id ?? "");
  const [participantIds, setParticipantIds] = useState<string[]>(
    seed?.participants ?? (people[0] ? [people[0].id] : [])
  );
  const [error, setError] = useState("");
  const [touchedParticipants, setTouchedParticipants] = useState(Boolean(seed));

  // `people` can go from empty to populated after this hook's first render
  // (e.g. the "add expense" form mounts before anyone's been added yet).
  // useState's initial value only runs once on mount, so without this
  // effect `paidBy`/`participantIds` would stay stuck at "" / [] forever
  // once locked in on that first empty render. This keeps them in sync
  // whenever paidBy is no longer a valid choice in `people` — covering both
  // that empty-to-populated transition and the (currently impossible, but
  // cheap to guard) case of the payer disappearing from the list.
  useEffect(() => {
    if (seed) return; // editing an existing expense — don't touch its saved values
    if (!people.some((p) => p.id === paidBy)) {
      const fallback = people[0]?.id ?? "";
      setPaidBy(fallback);
      if (!touchedParticipants) {
        setParticipantIds(fallback ? [fallback] : []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, seed]);

  function handlePaidByChange(id: string) {
    setPaidBy(id);
    // Keep the default of "just the payer" in sync until the user has
    // manually adjusted the participant checkboxes themselves.
    if (!touchedParticipants) {
      setParticipantIds([id]);
    }
  }

  function toggleParticipant(id: string) {
    setTouchedParticipants(true);
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function reset() {
    setDescription("");
    setAmount("");
    setParticipantIds(people[0] ? [people[0].id] : []);
    setPaidBy(people[0]?.id ?? "");
    setTouchedParticipants(false);
    setError("");
  }

  /** Validates the current fields and returns a NewExpense, or null (with `error` set) if invalid. */
  function validate(): NewExpense | null {
    const trimmedDescription = description.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedDescription) {
      setError("Give the expense a short description.");
      return null;
    }
    if (!paidBy) {
      setError("Choose who paid.");
      return null;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return null;
    }
    if (participantIds.length === 0) {
      setError("Select at least one person to split this with.");
      return null;
    }

    return {
      description: trimmedDescription,
      amount: parsedAmount,
      paidBy,
      participants: participantIds,
      completed: seed?.completed ?? false,
    };
  }

  return {
    description,
    setDescription,
    amount,
    setAmount,
    paidBy,
    setPaidBy: handlePaidByChange,
    participantIds,
    toggleParticipant,
    error,
    setError,
    reset,
    validate,
  };
}
