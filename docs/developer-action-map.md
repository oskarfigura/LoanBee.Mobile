# Developer Action Map

This document is the quickest way for a future developer to answer two questions:

1. Which screen owns a given user action?
2. Which stored entities and route transitions does that action affect?

For detailed mortgage-tracker behaviour, validation, and edge cases, also read [saved-mortgage-journeys.md](./saved-mortgage-journeys.md).

## Top-level routes

| Route | Purpose | Main actions |
|---|---|---|
| `/(tabs)/index` | Home tab | Show the pinned mortgage dashboard, or open the guided calculator/tracking setup |
| `/(tabs)/result` | Hidden result tab | Review calculation, save/track, share, leave with unsaved-result guard |
| `/(tabs)/saved` | Tracked and recent list | Open tracked loan/mortgage, manage recent calculations, toggle pin, jump back into the Home calculation journey |
| `/(tabs)/settings` | Settings tab | Change language/currency, reopen guide/about, manage data |
| `/about` | Formula/about route | Read product explanation, FAQ, and disclaimer from Settings |
| `/guide` | Onboarding walkthrough | Mark guide seen, jump into calculator |
| `/calculator/share` | Shared-calculation entrypoint | Parse deep link / share URL and route into Result |
| `/saved/new` | Save flow | Name a calculation, choose category/currency, create initial deal |
| `/saved/track` | Current/future mortgage setup | Track from latest balance or a future start date |
| `/saved/history` | Mortgage history setup | Create the original mortgage and first real deal before completing/adding later deals |
| `/saved/[id]` | Saved loan detail | Review loan or mortgage, rename, delete, pin, open child flows |
| `/saved/[id]/edit` | Saved loan editor | Edit metadata and jump back to calculator for recalculation |
| `/saved/[id]/overpayments` | Loan overpayment editor | Adjust simple saved-loan overpayment inputs |
| `/saved/[id]/deals/new` | Mortgage deal creator | Start first/current/next deal draft |
| `/saved/[id]/deals/[dealId]` | Mortgage deal editor | View, edit, correct, publish, or delete latest deal |
| `/saved/[id]/events/new` | Mortgage event creator | Add overpayment, checkpoint, missed payment, holiday, note |
| `/saved/[id]/events/[eventId]` | Mortgage event editor | Edit or delete an existing mortgage event |
| `/saved/[id]/complete-current` | Mortgage completion flow | Close the active deal and rebase later drafts |

## Root navigation wiring

`app/_layout.tsx` owns the root stack and registers the non-tab routes. The current stack shape matters because several actions rely on modal presentation or hidden routes:

- `saved/new`, `saved/track`, `saved/history`, `saved/[id]/deals/new`, `saved/[id]/events/new`, and `saved/[id]/complete-current` open as modals.
- The Results screen lives inside the tab navigator as `/(tabs)/result`, but it is hidden from the tab bar with `href: null`.
- `/about` sits above the tab shell and is entered from Settings.
- `guide` and all `saved/*` detail routes sit above the tab shell and can be entered from multiple tabs.

## Home tab modes

The first tab is Home. `app/(tabs)/index.tsx` restores the pinned dashboard as the default logged-in surface, then opens the guided calculator when requested:

| Mode | Trigger | What the user sees |
|---|---|---|
| First-run onboarding | `guide_seen_v1` not set and the consent gate has completed | `/guide?firstRun=1` is pushed |
| Dashboard mode | One or more loans are pinned and no calculator override is active | Home dashboard carousel with pinned tracked loans/mortgages |
| Borrowing step | No pinned loans, dashboard CTA, or `calculator=1` param | Mortgage vs personal-loan choice as the first guided step |
| Intent step | User chooses a borrowing type | Explore scenario vs track borrowing choice as the second guided step |
| Scenario mode | User chooses "Explore scenario" | Category-aware calculator form without the upfront choices pinned above it |
| Track mode | User chooses "Track borrowing" | Mortgage setup-path choice, or loan calculation-to-track flow |

Related behaviours:

- Tapping the Home tab sends a fresh `dashboard` param so the calculator collapses back to the pinned dashboard when one exists.
- Leaving the hidden Result route is guarded while the result is unsaved.
- Returning from Tracked/Settings with `fromDashboard=1` should route back to `/`, not deeper into nested history.

## Core action flows

### 1. First launch

- Entry: app open
- Files: `app/(tabs)/index.tsx`, `app/guide.tsx`, `src/onboarding/guideState.ts`, `src/onboarding/firstRunGate.ts`
- State changes:
  - waits for the consent flow to finish
  - pushes `/guide?firstRun=1` if the guide has not been seen
  - sets `guide_seen_v1` when the guide screen mounts

### 2. Calculate -> review result -> save/share

- Entry: Home tab, scenario mode
- Files: `app/(tabs)/index.tsx`, `app/(tabs)/result.tsx`, `app/(tabs)/saved.tsx`, `app/saved/new.tsx`
- State changes:
  - calculator submits pure-TS `getLoanCalculations(...)`
  - draft result params are passed into the hidden Result route and a `RecentCalculation` is persisted
  - Result can share the calculation URL, reopen from Tracked → Recent calculations, or open `/saved/new`
  - unsaved results set a leave guard until the user saves or discards

### 3. Save a calculation

- Entry: Result -> Save
- Files: `app/saved/new.tsx`, `src/loans/loanGroupFactory.ts`, `src/storage/savedLoans.ts`
- State changes:
  - creates a `SavedLoan` / `LoanGroup`
  - normalises `formSnapshot` and `resultSnapshot`
  - creates the initial `LoanDeal`
  - auto-pins the new loan with `dashboardOrder = getMaxDashboardOrder() + 1`
  - routes to `/saved/[id]?fromSave=1`

### 4. Track a mortgage from today or future start

- Entry: Home → Calculate → borrowing type → Track borrowing → Track from latest statement
- Files: `app/saved/track.tsx`, `src/mortgage/trackBuilder.ts`, `src/storage/savedLoans.ts`
- State changes:
  - creates a `LoanGroup` with one `userDeal` active deal
  - if the start date is in the future, progress/activity are hidden until that date
  - auto-pins the tracked mortgage with `dashboardOrder = getMaxDashboardOrder() + 1`
  - routes to `/saved/[id]?fromSave=1`

### 5. Build mortgage history

- Entry: Home → Calculate → borrowing type → Track borrowing → Build mortgage history
- Files: `app/saved/history.tsx`, `app/saved/[id]/complete-current.tsx`, `app/saved/[id]/deals/new.tsx`
- State changes:
  - creates the original mortgage plus first real deal from the historic start date
  - user then completes that deal with closing balance and historic overpayments
  - later deals are added through the existing deal lifecycle

### 6. Review and manage a saved loan

- Entry: Tracked tab, or post-save redirect
- Files: `app/saved/[id].tsx`, `src/components/loans/MortgageDetailView.tsx`
- Shared actions:
  - rename
  - delete
  - edit metadata
  - pin / unpin from dashboard
- Mortgage-only actions:
  - open Overview / Projection / Timeline tabs
  - add next deal
  - complete current deal
  - add and edit mortgage events
  - correct the latest completed deal

### 7. Shared link / deep link

- Entry: `/calculator/share`
- Files: `app/calculator/share.tsx`, `src/share/calculationShareLink.ts`
- State changes:
  - parses search params from a web URL or `loanbee://calculator/share` deep link
  - recomputes the result locally
  - replaces into the hidden Result route

## Persisted entities

| Entity | Stored in | Purpose |
|---|---|---|
| `LoanGroup` / `SavedLoan` | `saved_loans_v2` | Root saved record for a loan or mortgage |
| `LoanDeal` | nested in `SavedLoan.deals` | Current, completed, or draft mortgage period |
| `MortgageEvent` | nested in `SavedLoan.events` | One-off overpayment, checkpoint, holiday, note, missed payment |
| `formSnapshot` | nested in `SavedLoan` | Original calculator inputs |
| `resultSnapshot` | nested in `SavedLoan` | Original calculation summary and baseline-interest values |
| `RecentCalculation` | `recent_calculations_v1` | User-visible automatic calculation history, separate from tracked borrowing |

Important persistence rules:

- `saved_loans_v2` is the current MMKV key.
- `recent_calculations_v1` stores the capped newest-first recent-calculation list.
- `saved_loans_v1` is the legacy key still migrated by `savedLoansStorage`.
- Legacy records are upgraded into the deal-based model on read.
- `pinnedToDashboard` plus `dashboardOrder` controls the home dashboard carousel.
- Each saved loan keeps its own `currency`; result and chart UI should format with the loan currency, not the global default.

## Where to look for mortgage-specific business rules

Use these files together:

- [saved-mortgage-journeys.md](./saved-mortgage-journeys.md): user journeys, validation rules, deliberate scope boundaries
- `src/mortgage/tracker.ts`: deal sequencing, correction rules, activation/completion logic
- `src/mortgage/projection.ts`: projected balance and chart data
- `src/storage/savedLoans.ts`: migration and persistence wiring
- `src/types/SavedLoan.ts`: entity model

## Test map

`npm test` runs three ts-jest projects declared in `package.json`:

- `core`: pure maths engine tests
- `storage`: saved-loan, route-param, utility, and mortgage-tracker tests
- `design-system`: typography/design-token tests
