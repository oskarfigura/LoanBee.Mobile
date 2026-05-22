import { CurrencyCode } from '@/currency/currencies';
import { formatCurrency } from '@/currency/format';
import {
  LoanDashboardProgress,
  LoanInsightProgress,
  LoanInsightSummary,
  buildCalculationSummary,
  buildSavedLoanDashboardProgress,
  buildSavedLoanSummary,
} from '@/loans/loanInsightSummary';
import { LoanResult } from '@/results/loanResultRoute';
import { SavedLoan } from '@/types/SavedLoan';
import { formatFriendlyMonthYear, parseDateLabelValue } from '@/utils/date';

export type UserVisibleMetric = {
  id: string;
  labelKey: string;
  value: string;
};

export type UserVisibleSection = {
  id: string;
  metrics: UserVisibleMetric[];
};

export type UserVisibleLoanSummary = Omit<LoanInsightSummary, 'hero' | 'metrics' | 'progress'> & {
  hero: UserVisibleMetric;
  metrics: UserVisibleMetric[];
  progress?: Omit<LoanInsightProgress, 'metrics'> & {
    metrics: UserVisibleMetric[];
  };
};

export type CalculationDisplayContract = {
  summary: UserVisibleLoanSummary;
  sections: UserVisibleSection[];
  totalMonths: number;
  termDuration: string;
};

export type SavedLoanDisplayContract = {
  summary: UserVisibleLoanSummary;
  dashboardProgress: LoanDashboardProgress[];
  dashboardMetrics: UserVisibleMetric[];
};

export type AmortisationDisplayRow = {
  id: string;
  itemNo: number;
  period: string;
  metrics: UserVisibleMetric[];
};

type AmortisationSourceItem = {
  itemNo: number;
  date?: string;
  remaining: string;
  principal: string;
  interest: string;
  ending: string;
};

const calculationMetricIds = [
  'loanAmount',
  'payoffDate',
  'interestRate',
  'totalInterest',
  'totalCost',
];

const savedMetricIdByLabelKey: Record<string, string> = {
  'mortgage.currentBalance': 'currentBalance',
  'results.monthlyPayment': 'monthlyPayment',
  'calculator.interestRate': 'interestRate',
  'results.payoffDate': 'payoffDate',
  'results.totalInterest': 'totalInterest',
  'results.totalCost': 'totalCost',
  'mortgage.estimatedInterestPaid': 'estimatedInterestPaid',
  'mortgage.estimatedSavings': 'estimatedSavings',
  'mortgage.paidSoFar': 'paidSoFar',
};

const dashboardMetricKeys = [
  'mortgage.currentBalance',
  'results.monthlyPayment',
  'results.payoffDate',
];

const makeMetric = (id: string, labelKey: string, value: string): UserVisibleMetric => ({
  id,
  labelKey,
  value,
});

const getMetric = (metrics: UserVisibleMetric[], id: string): UserVisibleMetric | undefined => (
  metrics.find(metric => metric.id === id)
);

const addIdsToCalculationSummary = (summary: LoanInsightSummary): UserVisibleLoanSummary => {
  const { progress: _progress, ...summaryWithoutProgress } = summary;

  return {
    ...summaryWithoutProgress,
    hero: makeMetric('monthlyPayment', summary.hero.labelKey, summary.hero.value),
    metrics: summary.metrics.map((metric, index) => (
      makeMetric(calculationMetricIds[index] ?? metric.labelKey, metric.labelKey, metric.value)
    )),
  };
};

const getSavedMetricId = (labelKey: string, index: number): string => (
  savedMetricIdByLabelKey[labelKey] ?? `${labelKey}-${index}`
);

const addIdsToSavedSummary = (summary: LoanInsightSummary): UserVisibleLoanSummary => ({
  ...summary,
  hero: makeMetric(getSavedMetricId(summary.hero.labelKey, -1), summary.hero.labelKey, summary.hero.value),
  metrics: summary.metrics.map((metric, index) => (
    makeMetric(getSavedMetricId(metric.labelKey, index), metric.labelKey, metric.value)
  )),
  progress: summary.progress ? {
    ...summary.progress,
    metrics: summary.progress.metrics.map((metric, index) => (
      makeMetric(getSavedMetricId(metric.labelKey, index), metric.labelKey, metric.value)
    )),
  } : undefined,
});

const formatTermDuration = (months: number, yrsLabel: string, moLabel: string): string => {
  const years = Math.floor(months / 12);
  const mo = months % 12;
  if (years === 0) return `${mo} ${moLabel}`;
  if (mo === 0) return `${years} ${yrsLabel}`;
  return `${years} ${yrsLabel} ${mo} ${moLabel}`;
};

export const buildCalculationDisplayContract = ({
  result,
  startDate,
  currency,
  locale,
  additionalMonthlyPayment = 0,
  yearsLabel = 'yrs',
  monthsLabel = 'mo',
}: {
  result: LoanResult;
  startDate: string;
  currency: CurrencyCode;
  locale?: string;
  additionalMonthlyPayment?: number;
  yearsLabel?: string;
  monthsLabel?: string;
}): CalculationDisplayContract => {
  const summary = addIdsToCalculationSummary(
    buildCalculationSummary(result, startDate, currency, locale),
  );
  const totalMonths = Math.max(
    result.tableItems.length,
    result.termInYears * 12 + result.termInMonths,
  );
  const monthlyPayment = summary.hero;
  const loanAmount = getMetric(summary.metrics, 'loanAmount');
  const payoffDate = getMetric(summary.metrics, 'payoffDate');
  const interestRate = getMetric(summary.metrics, 'interestRate');
  const totalInterest = getMetric(summary.metrics, 'totalInterest');
  const totalCost = getMetric(summary.metrics, 'totalCost');
  const loanDetailsMetrics = [
    loanAmount,
    interestRate,
    additionalMonthlyPayment > 0
      ? makeMetric(
        'additionalMonthlyPayment',
        'calculator.additionalPayment',
        formatCurrency(additionalMonthlyPayment, currency),
      )
      : undefined,
  ].filter((metric): metric is UserVisibleMetric => Boolean(metric));

  return {
    summary,
    totalMonths,
    termDuration: formatTermDuration(totalMonths, yearsLabel, monthsLabel),
    sections: [
      {
        id: 'keyMetrics',
        metrics: [monthlyPayment, payoffDate, totalInterest, totalCost]
          .filter((metric): metric is UserVisibleMetric => Boolean(metric)),
      },
      {
        id: 'loanDetails',
        metrics: loanDetailsMetrics,
      },
    ],
  };
};

export const buildSavedLoanDisplayContract = ({
  loan,
  result,
  asOf = new Date(),
  locale,
}: {
  loan: SavedLoan;
  result: LoanResult;
  asOf?: Date;
  locale?: string;
}): SavedLoanDisplayContract => {
  const summary = addIdsToSavedSummary(buildSavedLoanSummary(loan, result, asOf, locale));
  const candidates = [summary.hero, ...summary.metrics, ...(summary.progress?.metrics ?? [])];
  const seenKeys = new Set<string>();
  const dashboardMetrics = dashboardMetricKeys
    .map(key => candidates.find(metric => metric.labelKey === key))
    .filter((metric): metric is UserVisibleMetric => {
      if (!metric || seenKeys.has(metric.labelKey)) return false;
      seenKeys.add(metric.labelKey);
      return true;
    });

  return {
    summary,
    dashboardProgress: buildSavedLoanDashboardProgress(loan, result, asOf),
    dashboardMetrics,
  };
};

const formatAmortisationPeriodLabel = (
  startDate: string,
  periodNumber: number,
  language: string,
) => {
  const date = parseDateLabelValue(startDate);
  if (!date) return String(periodNumber);

  date.setMonth(date.getMonth() + periodNumber - 1);

  return formatFriendlyMonthYear(date.toISOString().split('T')[0], language);
};

export const buildAmortisationDisplayRows = ({
  items,
  startDate,
  currency,
  language,
}: {
  items: AmortisationSourceItem[];
  startDate: string;
  currency: CurrencyCode;
  language: string;
}): AmortisationDisplayRow[] => (
  items.map(item => ({
    id: String(item.itemNo),
    itemNo: item.itemNo,
    period: item.date
      ? formatFriendlyMonthYear(item.date, language)
      : formatAmortisationPeriodLabel(startDate, item.itemNo, language),
    metrics: [
      makeMetric('openingBalance', 'results.openingBalance', formatCurrency(+item.remaining, currency)),
      makeMetric('principal', 'results.principal', formatCurrency(+item.principal, currency)),
      makeMetric('interest', 'results.interest', formatCurrency(+item.interest, currency)),
      makeMetric('closingBalance', 'results.closingBalance', formatCurrency(+item.ending, currency)),
    ],
  }))
);
