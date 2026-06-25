import { useState, type FormEvent } from "react";
import type { Person } from "../types";

interface PeopleManagerProps {
  people: Person[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  isRemovable: (id: string) => boolean;
}

export default function PeopleManager({ people, onAdd, onRemove, isRemovable }: PeopleManagerProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Enter a name first.");
      return;
    }
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("That person's already in the group.");
      return;
    }

    onAdd(trimmed);
    setName("");
    setError("");
  }

  return (
    <section className="card">
      <h2>People</h2>
      <form className="people-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add someone's name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="field-error">{error}</p>}

      {people.length === 0 ? (
        <p className="empty-hint">Add at least two people to start splitting expenses.</p>
      ) : (
        <ul className="chip-list">
          {people.map((p) => {
            function handleRemoveClick() {
              if (isRemovable(p.id)) {
                onRemove(p.id);
              } else {
                window.alert(
                  `${p.name} can't be removed because they're part of an existing expense (as the payer or someone splitting a bill). Remove or edit those expenses first if you need to take ${p.name} out of the group.`
                );
              }
            }

            return (
              <li key={p.id} className="chip">
                {p.name}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${p.name}`}
                  onClick={handleRemoveClick}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
