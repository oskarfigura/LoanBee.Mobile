import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LoanInsightCard } from '@/components/loans/LoanInsightCard';
import { CurrencyCode } from '@/currency/currencies';
import {
  buildCalculationSummary,
  buildSavedLoanSummary,
} from '@/loans/loanInsightSummary';
import { LoanResult } from '@/results/loanResultRoute';
import { colours, fonts, fontSizes, fontWeights, spacing } from '@/theme';
import { SavedLoan } from '@/types/SavedLoan';

interface Props {
  result: LoanResult;
  startDate: string;
  currency: CurrencyCode;
  mode?: 'calculation' | 'saved';
  savedLoan?: SavedLoan;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  onShare?: () => void;
  shareLabel?: string;
  shareIcon?: React.ReactNode;
}

export const LoanSummaryOverview = ({
  result,
  startDate,
  currency,
  mode = 'calculation',
  savedLoan,
  title,
  subtitle,
  headerAction,
  onShare,
  shareLabel,
  shareIcon,
}: Props) => {
  const { t, i18n } = useTranslation();
  const summary = useMemo(() => (
    mode === 'saved' && savedLoan
      ? buildSavedLoanSummary(savedLoan, result, new Date(), i18n.language)
      : buildCalculationSummary(result, startDate, currency, i18n.language)
  ), [currency, i18n.language, mode, result, savedLoan, startDate]);

  const shareAction = onShare ? (
    <TouchableOpacity
      style={styles.shareAction}
      onPress={onShare}
      activeOpacity={0.82}
      accessibilityRole="button"
    >
      {shareIcon ? <View style={styles.shareIcon}>{shareIcon}</View> : null}
      <Text style={styles.shareText} numberOfLines={1} adjustsFontSizeToFit>
        {shareLabel ?? t('share.short')}
      </Text>
    </TouchableOpacity>
  ) : null;

  return (
    <LoanInsightCard
      summary={summary}
      density="full"
      title={title}
      subtitle={subtitle}
      headerAction={headerAction ?? shareAction}
      showProgress={mode === 'saved'}
      style={styles.card}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  shareAction: {
    minHeight: 32,
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    paddingHorizontal: 10,
  },
  shareIcon: {
    marginRight: 5,
  },
  shareText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colours.primary,
  },
});
