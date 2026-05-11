import { LoanGroup, MortgageEvent } from '@/types/SavedLoan';

export const upsertMortgageEvent = (
  loan: LoanGroup,
  event: MortgageEvent,
): LoanGroup => {
  const exists = loan.events.some(item => item.id === event.id);

  return {
    ...loan,
    events: exists
      ? loan.events.map(item => item.id === event.id ? event : item)
      : [...loan.events, event],
  };
};

export const removeMortgageEvent = (
  loan: LoanGroup,
  eventId: string,
): LoanGroup => ({
  ...loan,
  events: loan.events.filter(event => event.id !== eventId),
});
