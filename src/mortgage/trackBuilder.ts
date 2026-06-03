import { CurrencyCode } from '@/currency/currencies';
import {
  LOAN_GROUP_SCHEMA_VERSION,
  LoanDeal,
  LoanFormSnapshot,
  LoanGroup,
  LoanResultSnapshot,
  MortgageEvent,
  MortgageRepaymentType,
} from '@/types/SavedLoan';
import { buildMortgageProjection } from '@/mortgage/projection';
import {
  calculateDealMonthlyPayment,
  generateDefaultDealName,
  getChronologicalDeals,
  getCurrentDeal,
  getRemainingMortgageTermInMonths,
} from '@/mortgage/tracker';
import { createLocalId } from '@/utils/id';
import {
  addMonthsToIsoDate,
  formatIsoDate,
  isValidIsoDate,
  monthsBetween,
  parseDateLabelValue,
} from '@/utils/date';

// A single lump overpayment the user has already made on the current deal.
export interface TrackOverpaymentInput {
  date: string;
  amount: number;
}

/**
 * Today-anchored "track your mortgage" form values. The model is deliberately
 * anchored on the present: the user enters what they owe *now* and the terms of
 * the deal they're on *now*, rather than reconstructing the original loan and
 * every past remortgage. Current balance is therefore an input, not a figure
 * derived (and compounded with error) from a historic chain.
 */
export interface TrackMortgageFormValues {
  nickname: string;
  lender?: string;
  currency: CurrencyCode;
  /** What you owe today — the anchor of the whole model. */
  currentBalance: number;
  interestRate: number;
  repaymentType: MortgageRepaymentType;
  /** Months from today until the mortgage is fully repaid. */
  remainingTermInMonths: number;
  /** When the current fixed/tracker deal ends. Optional; powers the remortgage reminder. */
  dealEndDate?: string;
  /** Optional enrichment: a recurring monthly overpayment already in place. */
  regularOverpayment?: number;
  /** Optional enrichment: one-off overpayments already made on this deal. */
  lumpOverpayments?: TrackOverpaymentInput[];
  /**
   * The anchor date. Defaults to today; accepting it as a param keeps the
   * builder pure and testable.
   */
  startDate?: string;
}

const splitMonths = (totalMonths: number) => ({
  years: Math.floor(totalMonths / 12),
  months: totalMonths % 12,
});

// The fixed-deal period: from the anchor date to the deal-end date if the user
// gave one (and it's after the start), otherwise the deal simply runs to payoff.
const resolveDealDurationMonths = (
  startDate: string,
  remainingTermInMonths: number,
  dealEndDate?: string,
): number => {
  if (dealEndDate && isValidIsoDate(dealEndDate)) {
    const months = monthsBetween(startDate, dealEndDate);
    if (months >= 1) return Math.min(months, remainingTermInMonths);
  }
  return remainingTermInMonths;
};

/**
 * Build a fully-tracked mortgage from today-anchored form values. Produces one
 * active deal anchored at `startDate` with `openingBalance` set to the current
 * balance, then runs the shared projection to populate the result snapshot the
 * dashboard reads.
 */
export const buildTrackedMortgageFromForm = (
  values: TrackMortgageFormValues,
  options: { id?: string; createdAt?: string } = {},
): LoanGroup => {
  const timestamp = new Date().toISOString();
  const startDate = values.startDate ?? formatIsoDate(new Date());
  const remainingTermInMonths = Math.max(1, Math.round(values.remainingTermInMonths));
  const term = splitMonths(remainingTermInMonths);
  const regularOverpayment = Math.max(0, values.regularOverpayment ?? 0);

  const dealDurationMonths = resolveDealDurationMonths(
    startDate,
    remainingTermInMonths,
    values.dealEndDate,
  );
  const dealDuration = splitMonths(dealDurationMonths);
  const endDate = addMonthsToIsoDate(startDate, dealDurationMonths);
  const monthlyPayment = calculateDealMonthlyPayment(
    values.currentBalance,
    values.interestRate,
    remainingTermInMonths,
    values.repaymentType,
  );

  const dealId = createLocalId('deal');
  const deal: LoanDeal = {
    id: dealId,
    createdAt: timestamp,
    updatedAt: timestamp,
    name: generateDefaultDealName(dealDuration.years, dealDuration.months, values.repaymentType),
    lender: values.lender || undefined,
    status: 'active',
    startDate,
    endDate,
    openingBalance: values.currentBalance,
    interestRate: values.interestRate,
    repaymentType: values.repaymentType,
    monthlyPayment,
    regularOverpayment,
    additionalBorrowing: 0,
    remainingTermInYears: term.years,
    remainingTermInMonths: term.months,
    source: 'userDeal',
  };

  const events: MortgageEvent[] = (values.lumpOverpayments ?? [])
    .filter(row => isValidIsoDate(row.date) && row.amount > 0)
    .map(row => ({
      id: createLocalId('ev'),
      createdAt: timestamp,
      updatedAt: timestamp,
      dealId,
      type: 'lumpOverpayment',
      date: row.date,
      amount: row.amount,
    }));

  const formSnapshot: LoanFormSnapshot = {
    loanAmount: values.currentBalance,
    interest: values.interestRate,
    termInYears: term.years,
    termInMonths: term.months,
    downPayment: 0,
    downPaymentType: 'CASH',
    desiredMonthlyPayment: null,
    additionalMonthlyPayment: regularOverpayment || null,
    startDate,
    calculationType: 'TERM',
    currency: values.currency,
  };

  const base: LoanGroup = {
    schemaVersion: LOAN_GROUP_SCHEMA_VERSION,
    id: options.id ?? createLocalId(),
    createdAt: options.createdAt ?? timestamp,
    updatedAt: timestamp,
    nickname: values.nickname.trim(),
    lender: values.lender || undefined,
    category: 'mortgage',
    currency: values.currency,
    mortgageTermInMonths: remainingTermInMonths,
    status: 'tracked',
    pinnedToDashboard: true,
    deals: [deal],
    events,
    formSnapshot,
    // Placeholder; replaced below once the projection runs over the seeded deal.
    resultSnapshot: {
      monthlyPayments: monthlyPayment,
      totalAmountPaid: 0,
      totalInterestPaid: 0,
      totalInterestPaidBaseline: 0,
      termInYears: term.years,
      termInMonths: term.months,
      totalTermInMonths: remainingTermInMonths,
    },
  };

  const projection = buildMortgageProjection(base);
  const resultSnapshot: LoanResultSnapshot = {
    monthlyPayments: monthlyPayment,
    totalAmountPaid: projection.totalAmountPaid,
    totalInterestPaid: projection.totalInterestPaid,
    totalInterestPaidBaseline: projection.totalInterestPaid + projection.overpaymentSavingsEstimate,
    termInYears: term.years,
    termInMonths: term.months,
    totalTermInMonths: remainingTermInMonths,
  };

  return { ...base, resultSnapshot };
};

/** Today-anchored seed values for the track form, derived from an existing loan. */
export interface TrackMortgageSeed {
  nickname: string;
  /** Empty string (not undefined) so it drops straight into the lender text input. */
  lender: string;
  currency: CurrencyCode;
  currentBalance: number;
  interestRate: number;
  repaymentType: MortgageRepaymentType;
  remainingTermInMonths: number;
  dealEndDate?: string;
  regularOverpayment: number;
  lumpOverpayments: TrackOverpaymentInput[];
}

/**
 * Derive today-anchored form seed values from an existing (legacy) loan when
 * resuming/finalising it in place.
 *
 * The new model anchors on *today*, so the current balance is read from the
 * loan's projection (its balance as of `asOfIso`) rather than the original
 * opening balance, and the deal-level fields come from the deal the user is on
 * now — the current deal, falling back to the most recent one — instead of the
 * chronologically first deal. The remaining term is likewise measured from today
 * to payoff, not the full original mortgage term.
 */
export const deriveTrackSeedFromLoan = (loan: LoanGroup, asOfIso: string): TrackMortgageSeed => {
  const deals = getChronologicalDeals(loan);
  const asOf = parseDateLabelValue(asOfIso) ?? new Date();
  const currentDeal = getCurrentDeal(loan, asOf) ?? deals[deals.length - 1];
  const hasDeals = deals.length > 0;

  // Current balance is the anchor of the new model. For a loan with deals it is
  // today's projected balance; a pristine draft (no deals) has nothing to
  // project, so fall back to whatever opening balance was captured.
  const currentBalance = hasDeals
    ? buildMortgageProjection(loan).currentBalance
    : loan.formSnapshot.loanAmount;

  const remainingTermInMonths = hasDeals
    ? getRemainingMortgageTermInMonths(loan, asOfIso)
    : (loan.mortgageTermInMonths ?? 0);

  // Past deals' overpayments are already baked into the projected balance, so
  // only carry forward the current deal's one-off overpayments.
  const lumpOverpayments = loan.events
    .filter(event => (
      event.type === 'lumpOverpayment'
      && (!currentDeal || event.dealId === currentDeal.id)
      && isValidIsoDate(event.date)
      && (event.amount ?? 0) > 0
    ))
    .map(event => ({ date: event.date, amount: event.amount ?? 0 }));

  return {
    nickname: loan.nickname,
    lender: loan.lender ?? '',
    currency: loan.currency,
    currentBalance,
    interestRate: currentDeal?.interestRate ?? loan.formSnapshot.interest,
    repaymentType: currentDeal?.repaymentType ?? 'repayment',
    remainingTermInMonths,
    // Only surface a still-future deal end; a past one is no longer the current deal.
    dealEndDate: currentDeal && currentDeal.endDate > asOfIso ? currentDeal.endDate : undefined,
    regularOverpayment: currentDeal?.regularOverpayment ?? 0,
    lumpOverpayments,
  };
};
