import type { PersonBalance, Transaction } from "../types";
import { formatCurrency } from "../utils/currency";

interface SettlementSummaryProps {
  balances: PersonBalance[];
  transactions: Transaction[];
  peopleCount: number;
}

function nameFor(balances: PersonBalance[], personId: string): string {
  return balances.find((b) => b.personId === personId)?.name ?? "Unknown";
}

export default function SettlementSummary({
  balances,
  transactions,
  peopleCount,
}: SettlementSummaryProps) {
  if (peopleCount < 2) {
    return null;
  }

  const allSettled = transactions.length === 0;

  return (
    <section className="card card--summary">
      <h2>Settle up</h2>
      <p className="card-subtitle">Net totals across every expense below, not just the latest one.</p>

      <ul className="balance-list">
        {balances.map((b) => (
          <li key={b.personId} className="balance-row">
            <span>{b.name}</span>
            <span
              className={
                b.balance > 0.005
                  ? "balance-amount balance-amount--positive"
                  : b.balance < -0.005
                  ? "balance-amount balance-amount--negative"
                  : "balance-amount"
              }
            >
              {b.balance > 0.005
                ? `gets back ${formatCurrency(b.balance)}`
                : b.balance < -0.005
                ? `owes ${formatCurrency(-b.balance)}`
                : "settled"}
            </span>
          </li>
        ))}
      </ul>

      <div className="transactions">
        <h3>{allSettled ? "Everyone's square" : "To settle up"}</h3>
        {allSettled ? (
          <p className="empty-hint">No payments needed — every balance is at zero.</p>
        ) : (
          <ul className="transaction-list">
            {transactions.map((t, i) => (
              <li key={`${t.from}-${t.to}-${i}`} className="transaction-card">
                <span className="transaction-card__from">{nameFor(balances, t.from)}</span>
                <span className="transaction-card__arrow">→</span>
                <span className="transaction-card__to">{nameFor(balances, t.to)}</span>
                <span className="transaction-card__amount">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
