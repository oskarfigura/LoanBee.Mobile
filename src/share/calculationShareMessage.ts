import { CurrencyCode } from '@/currency/currencies';
import { formatCurrency } from '@/currency/format';
import { LoanResult } from '@/results/loanResultRoute';
import { getCalculationWebShareUrl, ShareableCalculationValues } from '@/share/calculationShareLink';

export type ShareTranslate = (key: string, options?: Record<string, string>) => string;

export interface CalculationSharePayload {
  title: string;
  message: string;
  url: string;
}

export interface CalculationShareInput {
  result: LoanResult;
  formValues: Partial<ShareableCalculationValues>;
  currency: CurrencyCode;
  t: ShareTranslate;
}

export const buildCalculationSharePayload = ({
  result,
  formValues,
  currency,
  t,
}: CalculationShareInput): CalculationSharePayload => {
  const shareValues = {
    ...formValues,
    currency,
  } as ShareableCalculationValues;
  const shareUrl = getCalculationWebShareUrl(shareValues);
  const monthlyPayment = formatCurrency(result.monthlyPayments, currency);
  const totalInterest = formatCurrency(result.totalInterestPaid, currency);
  const totalCost = formatCurrency(result.totalAmountPaid, currency);

  return {
    title: t('share.title'),
    message: [
      t('share.intro'),
      '',
      t('share.monthlyPayment', { amount: monthlyPayment }),
      t('share.totalInterest', { amount: totalInterest }),
      t('share.totalCost', { amount: totalCost }),
      '',
      t('share.viewCalculation'),
      shareUrl,
    ].join('\n'),
    url: shareUrl,
  };
};
