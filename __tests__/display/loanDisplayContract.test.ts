import { describe, expect, it } from '@jest/globals';
import { DownPaymentType } from '../../src/core/DownPaymentType';
import { LoanCalculationType } from '../../src/core/LoanCalculationType';
import { getLoanCalculations } from '../../src/core/amortisation';
import {
  buildAmortisationDisplayRows,
  buildCalculationDisplayContract,
  buildSavedLoanDisplayContract,
} from '../../src/loans/loanDisplayContract';
import { buildInitialDeal, buildResultSnapshot, normaliseFormSnapshot } from '../../src/loans/loanGroupFactory';
import { getResultForSavedLoan } from '../../src/results/loanResultRoute';
import { LoanGroup } from '../../src/types/SavedLoan';

const findMetric = (
  metrics: Array<{ id: string; value: string; labelKey: string }>,
  id: string,
) => metrics.find(metric => metric.id === id);

const makeCalculationResult = ({
  currency = 'GBP',
  additionalMonthlyPayment = 0,
  calculationType = LoanCalculationType.TERM,
  desiredMonthlyPayment = 0,
}: {
  currency?: 'GBP' | 'PLN';
  additionalMonthlyPayment?: number;
  calculationType?: LoanCalculationType;
  desiredMonthlyPayment?: number;
} = {}) => {
  const result = getLoanCalculations(
    300000,
    3.5,
    calculationType === LoanCalculationType.TERM ? 25 : 0,
    0,
    desiredMonthlyPayment,
    calculationType,
    10,
    DownPaymentType.PERCENT,
    additionalMonthlyPayment,
    '2026-01-01',
  );

  return { result, currency };
};

const makeMortgage = (overrides: Partial<LoanGroup> = {}): LoanGroup => {
  const formSnapshot = normaliseFormSnapshot({
    loanAmount: 240000,
    interest: 4.2,
    termInYears: 25,
    termInMonths: 0,
    downPayment: 0,
    downPaymentType: DownPaymentType.CASH,
    desiredMonthlyPayment: null,
    additionalMonthlyPayment: 150,
    startDate: '2026-06-01',
    calculationType: LoanCalculationType.TERM,
  }, 'GBP');
  const result = getLoanCalculations(
    formSnapshot.loanAmount,
    formSnapshot.interest,
    formSnapshot.termInYears,
    formSnapshot.termInMonths,
    formSnapshot.desiredMonthlyPayment ?? 0,
    formSnapshot.calculationType.toLowerCase(),
    formSnapshot.downPayment,
    formSnapshot.downPaymentType.toLowerCase(),
    formSnapshot.additionalMonthlyPayment ?? 0,
    formSnapshot.startDate,
  );
  const baseline = getLoanCalculations(
    formSnapshot.loanAmount,
    formSnapshot.interest,
    formSnapshot.termInYears,
    formSnapshot.termInMonths,
    formSnapshot.desiredMonthlyPayment ?? 0,
    formSnapshot.calculationType.toLowerCase(),
    formSnapshot.downPayment,
    formSnapshot.downPaymentType.toLowerCase(),
    0,
    formSnapshot.startDate,
  );
  const createdAt = '2026-01-01T00:00:00.000Z';
  const loanBase: LoanGroup = {
    id: 'mortgage-1',
    createdAt,
    updatedAt: createdAt,
    nickname: 'Home mortgage',
    lender: 'Halifax',
    category: 'mortgage',
    currency: 'GBP',
    status: 'tracked',
    pinnedToDashboard: true,
    deals: [],
    events: [],
    formSnapshot,
    resultSnapshot: buildResultSnapshot(result, baseline.totalInterestPaid),
  };
  const loan = {
    ...loanBase,
    deals: [
      buildInitialDeal('deal-current', loanBase, { source: 'userDeal', durationInMonths: 60 }),
    ],
    ...overrides,
  };

  return loan;
};

describe('loan display contract', () => {
  it('builds semantic calculator figures for the result summary', () => {
    const { result } = makeCalculationResult();
    const contract = buildCalculationDisplayContract({
      result,
      startDate: '2026-01-01',
      currency: 'GBP',
      locale: 'en',
    });
    const keyMetrics = contract.sections.find(section => section.id === 'keyMetrics')?.metrics ?? [];
    const loanDetails = contract.sections.find(section => section.id === 'loanDetails')?.metrics ?? [];

    expect(contract.summary.hero).toEqual({
      id: 'monthlyPayment',
      labelKey: 'results.monthlyPayment',
      value: '£1,351.68',
    });
    expect(findMetric(keyMetrics, 'payoffDate')?.value).toBe('1st Jan 2051');
    expect(findMetric(keyMetrics, 'totalInterest')?.value).toBe('£135,505.09');
    expect(findMetric(keyMetrics, 'totalCost')?.value).toBe('£435,505.09');
    expect(findMetric(loanDetails, 'loanAmount')?.value).toBe('£300,000.00');
    expect(findMetric(loanDetails, 'interestRate')?.value).toBe('3.5%');
    expect(findMetric(loanDetails, 'additionalMonthlyPayment')).toBeUndefined();
  });

  it('uses the selected currency and only shows additional payment when present', () => {
    const { result } = makeCalculationResult({
      currency: 'PLN',
      additionalMonthlyPayment: 250,
    });
    const contract = buildCalculationDisplayContract({
      result,
      startDate: '2026-01-01',
      currency: 'PLN',
      locale: 'pl',
      additionalMonthlyPayment: 250,
    });
    const loanDetails = contract.sections.find(section => section.id === 'loanDetails')?.metrics ?? [];

    expect(contract.summary.hero.value).toBe('zł1,601.68');
    expect(findMetric(loanDetails, 'additionalMonthlyPayment')).toEqual({
      id: 'additionalMonthlyPayment',
      labelKey: 'calculator.additionalPayment',
      value: 'zł250.00',
    });
  });

  it('supports payment-mode calculations without changing the display contract shape', () => {
    const { result } = makeCalculationResult({
      calculationType: LoanCalculationType.PAYMENT,
      desiredMonthlyPayment: 1800,
    });
    const contract = buildCalculationDisplayContract({
      result,
      startDate: '2026-03-01',
      currency: 'GBP',
      locale: 'en',
    });

    expect(contract.summary.hero.value).toBe('£1,800.00');
    expect(contract.totalMonths).toBe(result.tableItems.length);
    expect(contract.sections.find(section => section.id === 'keyMetrics')?.metrics.map(metric => metric.id)).toEqual([
      'monthlyPayment',
      'payoffDate',
      'totalInterest',
      'totalCost',
    ]);
  });

  it('uses saved-loan currency and active deal values for mortgage dashboard figures', () => {
    const base = makeMortgage();
    const loan = makeMortgage({
      currency: 'PLN',
      formSnapshot: {
        ...base.formSnapshot,
        currency: 'GBP',
      },
      deals: [{
        ...base.deals[0],
        lender: 'Current Bank',
        interestRate: 5.1,
        monthlyPayment: 1525,
      }],
    });
    const contract = buildSavedLoanDisplayContract({
      loan,
      result: getResultForSavedLoan(loan),
      asOf: new Date('2026-07-01T00:00:00Z'),
      locale: 'pl',
    });

    expect(contract.dashboardMetrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'currentBalance', value: expect.stringMatching(/^zł/) }),
      { id: 'monthlyPayment', labelKey: 'results.monthlyPayment', value: 'zł1,525.00' },
      expect.objectContaining({ id: 'payoffDate' }),
    ]));
    expect(contract.summary.metrics).toEqual(expect.arrayContaining([
      { id: 'monthlyPayment', labelKey: 'results.monthlyPayment', value: 'zł1,525.00' },
      { id: 'interestRate', labelKey: 'calculator.interestRate', value: '5.1%' },
      expect.objectContaining({ id: 'totalInterest', value: expect.stringMatching(/^zł/) }),
      expect.objectContaining({ id: 'totalCost', value: expect.stringMatching(/^zł/) }),
    ]));
  });

  it('exposes overpayment savings through the saved-loan progress contract', () => {
    const loan = makeMortgage({
      category: 'loan',
      deals: [],
    });
    const contract = buildSavedLoanDisplayContract({
      loan,
      result: getResultForSavedLoan(loan),
      asOf: new Date('2026-07-01T00:00:00Z'),
      locale: 'en',
    });

    expect(contract.summary.progress?.savingsAmount).toMatch(/^£/);
    expect(contract.summary.progress?.interestSaved).toBeGreaterThan(0);
    expect(contract.summary.progress?.metrics.map(metric => metric.id)).toEqual([
      'currentBalance',
      'paidSoFar',
    ]);
  });

  it('builds display-ready amortisation rows with period labels and formatted currency columns', () => {
    const rows = buildAmortisationDisplayRows({
      items: [
        {
          itemNo: 1,
          remaining: '250000',
          principal: '715.48',
          interest: '812.50',
          ending: '249284.52',
        },
        {
          itemNo: 2,
          remaining: '249284.52',
          principal: '717.81',
          interest: '810.17',
          ending: '248566.71',
        },
      ],
      startDate: '2026-01-01',
      currency: 'GBP',
      language: 'en',
    });

    expect(rows[0]).toEqual({
      id: '1',
      itemNo: 1,
      period: 'January 2026',
      metrics: [
        { id: 'openingBalance', labelKey: 'results.openingBalance', value: '£250,000.00' },
        { id: 'principal', labelKey: 'results.principal', value: '£715.48' },
        { id: 'interest', labelKey: 'results.interest', value: '£812.50' },
        { id: 'closingBalance', labelKey: 'results.closingBalance', value: '£249,284.52' },
      ],
    });
    expect(rows[1].period).toBe('February 2026');
    expect(findMetric(rows[1].metrics, 'closingBalance')?.value).toBe('£248,566.71');
  });
});
