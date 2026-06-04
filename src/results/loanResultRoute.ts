import { getLoanCalculations } from '@/core/amortisation';
import { DownPaymentType } from '@/core/DownPaymentType';
import { LoanCalculationType } from '@/core/LoanCalculationType';
import { CurrencyCode } from '@/currency/currencies';
import type { LoanCalculatorFormValues } from '@/hooks/useLoanCalculatorForm';
import { recentCalculationsStorage } from '@/storage/recentCalculations';
import type { LoanCategory, SavedLoan } from '@/types/SavedLoan';
import { createDraftResultSession } from './draftResultStore';

export type LoanResult = ReturnType<typeof getLoanCalculations>;

export const getResultForFormValues = (form: LoanCalculatorFormValues): LoanResult => (
  getLoanCalculations(
    form.loanAmount,
    form.interest,
    form.termInYears ?? 0,
    form.termInMonths ?? 0,
    form.desiredMonthlyPayment ?? 0,
    form.calculationType as LoanCalculationType,
    form.downPayment,
    form.downPaymentType as DownPaymentType,
    form.additionalMonthlyPayment,
    form.startDate,
  )
);

export const getResultForSavedLoan = (loan: SavedLoan): LoanResult => {
  const form = loan.formSnapshot;

  return getLoanCalculations(
    form.loanAmount,
    form.interest,
    form.termInYears,
    form.termInMonths,
    form.desiredMonthlyPayment ?? 0,
    form.calculationType.toLowerCase() as LoanCalculationType,
    form.downPayment,
    form.downPaymentType.toLowerCase() as DownPaymentType,
    form.additionalMonthlyPayment ?? 0,
    form.startDate,
  );
};

export const buildSavedLoanResultParams = (loan: SavedLoan) => ({
  mode: 'saved',
  savedLoanId: loan.id,
  savedLoan: JSON.stringify(loan),
  currency: loan.currency,
});

export const buildDraftResultParams = (
  result: LoanResult,
  formValues: LoanCalculatorFormValues,
  currency: CurrencyCode,
  category: LoanCategory = 'loan',
) => ({
  mode: 'draft',
  draftId: createDraftResultSession(result, formValues, currency).id,
  recentId: recentCalculationsStorage.addFromResult({
    result,
    formValues,
    currency,
    category,
  }).id,
  currency,
  category,
});

export const buildRecentResultParams = (recentId: string) => ({
  mode: 'recent',
  recentId,
});
