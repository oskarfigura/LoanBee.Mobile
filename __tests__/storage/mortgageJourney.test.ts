import { describe, expect, it } from '@jest/globals';
import {
  buildJourneySteps,
  findStep,
  getNextStep,
  firstUnansweredStep,
} from '../../src/mortgage/journey/steps';
import {
  applyStep,
  createMortgageHistoryDraft,
  publishJourneyLoan,
} from '../../src/mortgage/journey/reducers';
import { summariseDealChainChanges } from '../../src/mortgage/journey/chainDiff';
import { JourneyAnswer, JourneyStep } from '../../src/mortgage/journey/types';
import { buildMortgageProjection } from '../../src/mortgage/projection';
import { getChronologicalDeals } from '../../src/mortgage/tracker';
import { LoanGroup } from '../../src/types/SavedLoan';

// Per-deal scripted answers: index 0 is an ended deal with overpayments + a
// missed payment, index 1 is the ongoing current deal.
const provideAnswer = (loan: LoanGroup, step: JourneyStep): JourneyAnswer => {
  const dealIndex = step.dealIndex ?? 0;
  switch (step.kind) {
    case 'loan.currency': return { type: 'currency', currency: 'GBP' };
    case 'loan.nickname': return { type: 'text', text: 'Family home' };
    case 'loan.lender': return { type: 'text', text: 'Halifax' };
    case 'loan.openingBalance': return { type: 'number', value: 250000 };
    case 'loan.startDate': return { type: 'date', date: '2018-01-01' };
    case 'loan.totalTerm': return { type: 'duration', months: 300 };
    case 'deal.rate': return { type: 'number', value: dealIndex === 0 ? 2 : 4 };
    case 'deal.duration': return { type: 'duration', months: dealIndex === 0 ? 24 : 60 };
    case 'deal.repaymentType': return { type: 'choice', value: 'repayment' };
    case 'deal.regularOverpayment': return { type: 'number', value: dealIndex === 0 ? 100 : 0 };
    case 'deal.lumpOverpayments':
      return dealIndex === 0
        ? { type: 'overpayments', rows: [{ date: '2019-01-01', amount: 5000 }] }
        : { type: 'overpayments', rows: [] };
    case 'deal.missedPayments':
      return dealIndex === 0 ? { type: 'missed', dates: ['2019-06-01'] } : { type: 'missed', dates: [] };
    case 'deal.outcome':
      return { type: 'gate', value: dealIndex === 0 ? 'ended' : 'ongoing' };
    case 'deal.closingBalance': {
      const deal = loan.deals.find(item => item.id === step.dealId);
      return { type: 'number', value: deal?.completion?.closingBalance ?? 0 };
    }
    case 'deal.fees': return { type: 'number', value: 0 };
    default: return { type: 'none' };
  }
};

const driveJourney = (): LoanGroup => {
  let loan = createMortgageHistoryDraft('GBP');
  let step: JourneyStep | undefined = buildJourneySteps(loan)[0];

  for (let guard = 0; step && guard < 200; guard += 1) {
    loan = applyStep(loan, step, provideAnswer(loan, step));
    if (step.kind === 'review') break;
    step = getNextStep(loan, step.id);
  }

  return loan;
};

describe('mortgage journey steps', () => {
  it('starts with intro + loan steps and no deals or review', () => {
    const loan = createMortgageHistoryDraft('GBP');
    const steps = buildJourneySteps(loan);
    expect(steps.map(s => s.id)).toEqual([
      'intro',
      'loan.currency',
      'loan.nickname',
      'loan.lender',
      'loan.openingBalance',
      'loan.startDate',
      'loan.totalTerm',
    ]);
  });

  it('seeds the first deal once loan basics are answered', () => {
    let loan = createMortgageHistoryDraft('GBP');
    const order = ['loan.currency', 'loan.nickname', 'loan.lender', 'loan.openingBalance', 'loan.startDate', 'loan.totalTerm'];
    order.forEach(id => {
      const step = findStep(loan, id)!;
      loan = applyStep(loan, step, provideAnswer(loan, step));
    });
    expect(loan.deals).toHaveLength(1);
    expect(loan.deals[0].openingBalance).toBe(250000);
    expect(loan.deals[0].status).toBe('draft');
  });
});

describe('mortgage journey end-to-end', () => {
  it('builds a chained two-deal mortgage with the last deal left ongoing', () => {
    const loan = driveJourney();
    const deals = getChronologicalDeals(loan);

    expect(deals).toHaveLength(2);
    expect(deals[0].status).toBe('completed');
    expect(deals[1].status).toBe('active');
    expect(deals[0].interestRate).toBe(2);
    expect(deals[1].interestRate).toBe(4);
    expect(deals[0].regularOverpayment).toBe(100);

    // Deal 2's opening balance derives from deal 1's confirmed closing balance.
    const deal1Closing = deals[0].completion!.closingBalance;
    expect(deals[1].openingBalance).toBeCloseTo(deal1Closing, 0);

    // Lump overpayment + missed payment were recorded as events on deal 1.
    const deal1Events = loan.events.filter(event => event.dealId === deals[0].id);
    expect(deal1Events.some(e => e.type === 'lumpOverpayment' && e.amount === 5000)).toBe(true);
    expect(deal1Events.some(e => e.type === 'missedPayment')).toBe(true);
  });

  it('produces a loan that projects to sane totals', () => {
    const loan = driveJourney();
    const projection = buildMortgageProjection(loan);

    expect(projection.totalInterestPaid).toBeGreaterThan(0);
    expect(projection.totalAmountPaid).toBeGreaterThan(projection.totalInterestPaid);
    expect(projection.currentBalance).toBeGreaterThanOrEqual(0);
    expect(projection.currentBalance).toBeLessThan(250000);
  });

  it('publishes into a tracked loan with a populated result snapshot', () => {
    const published = publishJourneyLoan(driveJourney());

    expect(published.status).toBe('tracked');
    expect(published.resultSnapshot.totalInterestPaid).toBeGreaterThan(0);
    expect(published.resultSnapshot.totalTermInMonths).toBe(300);
    expect(published.resultSnapshot.monthlyPayments).toBeGreaterThan(0);
    expect(firstUnansweredStep(published).id).toBe('review');
  });
});

describe('waterfall edit review', () => {
  it('reports later deals whose opening balance shifts when an earlier closing balance changes', () => {
    const before = driveJourney();
    const deals = getChronologicalDeals(before);
    const closingStep = findStep(before, `deal:${deals[0].id}:closingBalance`)!;
    const newClosing = deals[0].completion!.closingBalance - 10000;

    const after = applyStep(before, closingStep, { type: 'number', value: newClosing });
    const changes = summariseDealChainChanges(before, after);

    const deal2Change = changes.find(change => change.dealId === deals[1].id);
    expect(deal2Change).toBeDefined();
    // Deal 2 opens at deal 1's confirmed closing balance, so it drops by the same amount.
    expect(deal2Change!.nextOpeningBalance).toBeCloseTo(deal2Change!.previousOpeningBalance - 10000, 0);
  });

  it('does not cascade when only a completed deal rate changes (closing balance is fixed)', () => {
    const before = driveJourney();
    const deals = getChronologicalDeals(before);
    const rateStep = findStep(before, `deal:${deals[0].id}:rate`)!;

    const after = applyStep(before, rateStep, { type: 'number', value: 5 });
    const changes = summariseDealChainChanges(before, after);

    expect(changes.some(change => change.dealId === deals[1].id)).toBe(false);
  });
});
