# Saved Mortgage Journeys, Deal Model, And Projection Presentation

## Summary

Saved mortgages are modeled as a mortgage account made from:

- An original calculation snapshot.
- A chronological chain of mortgage deals.
- Activity recorded against the current active deal.

The original calculation seeds the first deal, but it is not the live source of truth after the mortgage is being tracked. Live saved mortgage views should use deals, events, and lender-confirmed balances to explain the current mortgage state.

The product allows exactly one future draft deal. Drafts are provisional, excluded from official charts and totals, and recalculated from the lender-confirmed closing balance before they become active.

## Entity Rules

- `SavedLoan` / `LoanGroup` is the stored mortgage account.
- `formSnapshot` and `resultSnapshot` are the original estimate. They remain useful context, but should not be presented as the current mortgage state after deal tracking begins.
- `LoanDeal` is the official mortgage product period:
  - `active`: current deal; drives the current forecast and accepts events.
  - `completed`: historical deal; keeps previous context and lender-confirmed closing balance.
  - `draft`: future quote only; excluded from official projections and totals.
- `MortgageEvent` is activity inside an active deal only: lump overpayment, balance checkpoint, missed payment, payment holiday, or note.
- Opening balances follow this trust order:
  - completed lender closing balance;
  - bank-confirmed balance checkpoint;
  - projection from active deal terms and events;
  - original calculation seed.

## Editing Rules

- Only the latest chronological deal can be edited or deleted.
- If a user needs to edit an earlier deal, they must delete later deals until the target deal is latest.
- A sole initial active deal can be edited.
- An active latest deal can be edited.
- A draft latest deal can be edited, deleted, or published after the previous deal is completed.
- A completed latest deal can be corrected.
- Earlier completed deals and their events are read-only.
- Draft publishing is the only path that should show the "current deal needs completing" guard. Saving an already-active latest deal should never be blocked by that guard.

## Core Journeys

### Save calculation

The user saves a calculation as a mortgage. The app creates a mortgage account with one active initial deal seeded from the calculation values.

### Review current mortgage

The saved mortgage overview shows account-level state: current balance, balance paid down, projected payoff, and the source of the latest balance. It also shows which current deal is driving the live forecast.

### Log activity

The user records activity against the active deal. Events update projections immediately but do not rewrite completed deal history.

### Draft next deal

The user can create one future draft deal. The draft is shown as provisional and excluded from official projection totals. Its opening balance is a planning value based on the active deal projection plus any additional borrowing.

### Complete current deal

The user enters lender-confirmed completion details: completion date, closing balance, fees, and notes. This closes the active deal and rebases the draft opening balance from the confirmed closing balance.

### Publish next deal

After the previous deal is completed, the draft can become active. Before publishing, the user should review the recalculated opening balance, rate, term, payment, repayment type, and additional borrowing.

### Correct history

The user deletes later deals until the target deal is latest, then edits or corrects it. The app does not offer cascading edits across published later deals.

## Saved Mortgage Views

- The top summary should focus on mortgage-account state, not the original calculation.
- The current deal driver should show lender, rate, monthly payment, repayment type, end date, and regular overpayment.
- Timeline should preserve completed deals, current deal, one draft deal, and recent activity.
- Draft cards should explicitly say they are provisional and excluded from official totals until activated.
- Completed activity should be read-only unless the completed deal itself is the latest deal being corrected.

## Charts And Tables

- Default charts show the whole mortgage account across all published deals.
- Completed deals provide historical/account context.
- The current deal is the active segment driving the future forecast.
- Draft deals are excluded from repayment charts, cumulative charts, totals, and amortisation tables.
- Deal context should be visible near charts through segment labels, statuses, and date ranges.
- Repayment charts preserve principal vs interest while showing which deals are included.
- Cumulative charts show total paid, interest paid, and remaining balance across published deals.
- Amortisation rows should be grouped or labelled by deal so users can distinguish completed history from current projection.

## Edge Cases

- Current deal has expired but has not been completed.
- Draft exists while active-deal events change the projected future opening balance.
- Lender closing balance differs from projection.
- Additional borrowing creates a balance step-up at a new deal.
- Fees added and additional borrowing must not be double-counted.
- Balance checkpoint overrides the projected balance.
- Overpayment exceeds projected balance.
- Interest-only deal is followed by repayment deal, or vice versa.
- Missed payment and payment holiday suppress scheduled payment for that month.
- Completion date is before the deal start date or far outside the expected deal period.
- Legacy saved loans migrate into a one-deal mortgage account.

## Acceptance Criteria

- Editing a sole initial active deal saves without the completion guard.
- Editing an already-active latest deal saves without the completion guard.
- Publishing a draft remains blocked until the previous deal is completed.
- Non-latest deals are read-only.
- Deleting the latest deal reveals the previous deal as editable.
- Draft deals are excluded from official projection totals.
- Charts and tables show completed and current deal context.
- Completing the active deal rebases the draft opening balance from lender-confirmed closing balance.

