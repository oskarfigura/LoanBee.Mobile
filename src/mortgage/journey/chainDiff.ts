import { LoanGroup } from '@/types/SavedLoan';
import { DealChange } from './types';

const CENTS = 0.01;

/**
 * Compare two snapshots of a loan and report the later deals whose opening
 * balance or monthly payment shifted — the user-facing result of a waterfall
 * recalculation triggered by editing an earlier deal.
 */
export const summariseDealChainChanges = (before: LoanGroup, after: LoanGroup): DealChange[] => {
  const beforeById = new Map(before.deals.map(deal => [deal.id, deal]));
  const changes: DealChange[] = [];

  after.deals.forEach(nextDeal => {
    const prevDeal = beforeById.get(nextDeal.id);
    if (!prevDeal) return;

    const openingChanged = Math.abs(prevDeal.openingBalance - nextDeal.openingBalance) >= CENTS;
    const paymentChanged = Math.abs(prevDeal.monthlyPayment - nextDeal.monthlyPayment) >= CENTS;
    if (!openingChanged && !paymentChanged) return;

    changes.push({
      dealId: nextDeal.id,
      dealName: nextDeal.name,
      previousOpeningBalance: prevDeal.openingBalance,
      nextOpeningBalance: nextDeal.openingBalance,
      previousMonthlyPayment: prevDeal.monthlyPayment,
      nextMonthlyPayment: nextDeal.monthlyPayment,
    });
  });

  return changes;
};
