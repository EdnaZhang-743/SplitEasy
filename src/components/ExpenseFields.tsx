import type { Person } from "../types";

interface ExpenseFieldsProps {
  idPrefix: string;
  people: Person[];
  description: string;
  onDescriptionChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  paidBy: string;
  onPaidByChange: (value: string) => void;
  participantIds: string[];
  onToggleParticipant: (id: string) => void;
  error: string;
  submitLabel: string;
  onCancel?: () => void;
}

/**
 * The shared set of inputs for describing an expense (description, amount,
 * who paid, who it's split between). Used by both the "add a new expense"
 * form and the "edit an existing expense" form so they can never drift out
 * of sync with each other.
 */
export default function ExpenseFields({
  idPrefix,
  people,
  description,
  onDescriptionChange,
  amount,
  onAmountChange,
  paidBy,
  onPaidByChange,
  participantIds,
  onToggleParticipant,
  error,
  submitLabel,
  onCancel,
}: ExpenseFieldsProps) {
  return (
    <>
      <div className="field-row">
        <label htmlFor={`${idPrefix}-description`}>What was it for?</label>
        <input
          id={`${idPrefix}-description`}
          type="text"
          placeholder="e.g. Groceries, Hotel, Dinner"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="field-row field-row--split">
        <div>
          <label htmlFor={`${idPrefix}-amount`}>Amount</label>
          <input
            id={`${idPrefix}-amount`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-paidBy`}>Paid by</label>
          <select
            id={`${idPrefix}-paidBy`}
            value={paidBy}
            onChange={(e) => onPaidByChange(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="participants-field">
        <legend>Split between</legend>
        <div className="checkbox-grid">
          {people.map((p) => (
            <label key={p.id} className="checkbox-pill">
              <input
                type="checkbox"
                checked={participantIds.includes(p.id)}
                onChange={() => onToggleParticipant(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="field-error">{error}</p>}

      <div className="expense-fields__actions">
        <button type="submit" className="primary-button">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </>
  );
}
