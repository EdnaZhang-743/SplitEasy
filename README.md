# SplitEasy

A small React + TypeScript app for splitting shared group expenses and figuring out
who owes whom.

## Running it locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

To run the settlement logic's unit tests:

```bash
npm test
```

To build a production bundle:

```bash
npm run build
```

## How it's structured

- `src/types.ts` — shared domain types (`Person`, `Expense`, `Transaction`, etc.) used
  by both the logic and the UI, so they can't drift apart silently.
- `src/logic/settlement.ts` — the settlement math. Pure functions, no React or DOM
  dependency, so it can be (and is) unit tested in isolation. This is the part the
  brief calls "the heart of the task."
- `src/logic/settlement.test.ts` — unit tests for the above, covering even splits,
  uneven splits (rounding), partial-participant expenses, multi-expense accumulation,
  and the debt-matching algorithm.
- `src/components/` — UI components (`PeopleManager`, `ExpenseForm`, `ExpenseList`,
  `SettlementSummary`). These only render data and call back into `App.tsx`; none of
  them contain balance-calculation logic.
- `src/App.tsx` — holds the app's state (people, expenses) and wires the components
  to the settlement logic via `useMemo`.

The project uses TypeScript throughout (`strict` mode on), so `npm run build` runs a
full type check (`tsc -b`) before bundling, a type error fails the build, not just
a lint warning.

### Settlement approach

All money math is done in integer cents internally to avoid floating-point rounding
errors. Each expense is split evenly among its chosen participants; if it doesn't
divide evenly, leftover cents are distributed one at a time so the total always
reconciles exactly (no money is silently created or lost).

Net balances are turned into actual "who pays whom" instructions using a greedy
largest-debtor-to-largest-creditor matching. It doesn't guarantee the mathematically
absolute minimum number of transactions in every possible edge case, but it produces
a small, sensible set of payments in practice and is straightforward to follow.

## Written answers

**1. What was your workflow?**
I started by separating the problem into two halves: the settlement math (correctness-
critical, deserves tests) and the UI (presentation of that math). I wrote the
settlement module and its test suite first, entirely independent of any UI, to lock in
the correct behavior before building anything visual on top of it. Only once those
tests passed did I scaffold the React app and build components that consume the
already-tested logic. This let me verify the hard part (the math) was right before
spending time on layout and styling.

**2. What tools did you use?**
I used Claude to draft the settlement algorithm, generate the unit test suite, scaffold
the React components, and later migrate the whole codebase to TypeScript, with me
steering the architecture decisions (separating logic from UI, using integer cents,
the greedy matching approach, where shared types should live) and reviewing/running
the output at each step rather than accepting it blindly. I used Vite to scaffold the
project, TypeScript in strict mode for type safety, and Vitest for testing. All
standard tooling rather than anything AI-specific.

**3. What assumptions did you make, given the brief was vague?**
- Expenses are split evenly by default, but a user can deselect specific people from
  an expense (e.g., one person didn't have the dessert). The brief only required
  "shared across the group" as a minimum, so I treated full-group sharing as the
  default with per-expense overrides as the natural next step.
- State persists to localStorage so a session survives a page refresh, since losing
  the whole group on an accidental reload felt like it would undermine trust in the
  tool more than the added complexity was worth.
- No currency conversion or multi-currency support. Assumed a single shared currency
  per group, which covers the stated trip/dinner use case.
- People can't be removed once they're referenced by an existing expense (as payer or
  participant). Removal is blocked with an explanation rather than allowed to either
  rewrite history or leave dangling references, since silently wrong balances would
  undermine the "heart of the task."

**4. If you had another day, what would you add or improve?**
- Support unequal/custom splits (e.g., exact amounts or percentages per person), not
  just even splits among selected participants.
- Add a CSV/share export of the final settlement so the summary can be sent to the
  group outside the app.
- Expand test coverage to the UI layer (component/interaction tests), not just the
  settlement logic.
- Sync to a real backend instead of localStorage, so a group can be shared and updated
  across multiple people's devices rather than living in one browser.
