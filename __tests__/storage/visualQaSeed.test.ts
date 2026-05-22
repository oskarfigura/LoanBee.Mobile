import { describe, expect, it, beforeEach } from '@jest/globals';
import { buildVisualQaLoans, seedVisualQaLoans } from '../../src/dev/visualQaSeed';
import { savedLoansStorage } from '../../src/storage/savedLoans';

describe('visual QA seed data', () => {
  beforeEach(() => {
    savedLoansStorage.clear();
  });

  it('builds representative saved-loan fixtures for emulator visual checks', () => {
    const loans = buildVisualQaLoans();

    expect(loans).toHaveLength(5);
    expect(loans.map(loan => loan.id)).toEqual([
      'visual-qa-mortgage-current',
      'visual-qa-remortgage-chain',
      'visual-qa-pln-overpayment',
      'visual-qa-payment-mode',
      'visual-qa-interest-only-holiday',
    ]);
    expect(loans.some(loan => loan.currency === 'PLN')).toBe(true);
    expect(loans.some(loan => loan.category === 'loan' && (loan.formSnapshot.additionalMonthlyPayment ?? 0) > 0)).toBe(true);
    expect(loans.some(loan => loan.deals.some(deal => deal.status === 'draft'))).toBe(true);
    expect(loans.some(loan => loan.deals.some(deal => deal.repaymentType === 'interestOnly'))).toBe(true);
    expect(loans.some(loan => loan.events.some(event => event.type === 'paymentHoliday'))).toBe(true);
    expect(loans.filter(loan => loan.pinnedToDashboard)).toHaveLength(2);
  });

  it('replaces saved loans with deterministic fixtures', () => {
    seedVisualQaLoans();

    const loans = savedLoansStorage.getAll();
    expect(loans.map(loan => loan.id)).toEqual([
      'visual-qa-mortgage-current',
      'visual-qa-remortgage-chain',
      'visual-qa-pln-overpayment',
      'visual-qa-payment-mode',
      'visual-qa-interest-only-holiday',
    ]);
    expect(loans[0].dashboardOrder).toBe(1);
    expect(loans[1].dashboardOrder).toBe(2);
  });
});
