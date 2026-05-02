import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/currency/format';
import { CurrencyCode } from '@/currency/currencies';
import { LoanResult } from '@/results/loanResultRoute';
import { colours, fonts, fontSizes, fontWeights, radii } from '@/theme';
import { monthsBetween } from '@/utils/date';

interface Props {
  result: LoanResult;
  startDate: string;
  currency: CurrencyCode;
  mode?: 'calculation' | 'saved';
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  savingsAmount?: number;
  showSavings?: boolean;
  onShare?: () => void;
  shareLabel?: string;
  shareIcon?: React.ReactNode;
}

export const LoanSummaryOverview = ({
  result,
  startDate,
  currency,
  mode = 'calculation',
  title,
  subtitle,
  headerAction,
  savingsAmount,
  showSavings,
  onShare,
  shareLabel,
  shareIcon,
}: Props) => {
  const { t } = useTranslation();
  const principalAmount = result.amount - result.downPayment;
  const elapsed = Math.max(0, monthsBetween(startDate, new Date()));
  const total = Math.max(result.tableItems.length, 0);
  const progress = total > 0 ? Math.min(elapsed / total, 1) : 0;
  const remaining = Math.max(0, total - elapsed);
  const currentBalanceIndex = Math.min(elapsed, result.tableItems.length) - 1;
  const currentBalanceCandidate = currentBalanceIndex >= 0
    ? Number(result.tableItems[currentBalanceIndex]?.ending ?? principalAmount)
    : principalAmount;
  const currentBalance = Number.isFinite(currentBalanceCandidate) ? currentBalanceCandidate : principalAmount;
  const paidSoFar = Math.max(0, principalAmount - currentBalance);
  const shouldShowSavings = showSavings && savingsAmount !== undefined && savingsAmount > 0;
  const hasHeader = title || subtitle || headerAction;
  const downPaymentAmount = Math.max(result.downPayment, 0);
  const breakdownTotal = Math.max(principalAmount + downPaymentAmount + result.totalInterestPaid, 1);
  const breakdownSegments = [
    { key: 'principal', label: t('results.principal'), value: principalAmount, color: colours.primary },
    { key: 'deposit', label: t('calculator.downPayment'), value: downPaymentAmount, color: colours.teal },
    { key: 'interest', label: t('results.interest'), value: result.totalInterestPaid, color: colours.accent },
  ].filter(segment => segment.value > 0);
  const payoffDate = useMemo(() => {
    const date = new Date(startDate);
    if (Number.isNaN(date.getTime())) return '—';

    date.setMonth(date.getMonth() + result.termInYears * 12 + result.termInMonths);

    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  }, [result.termInMonths, result.termInYears, startDate]);

  const progressLabel = useMemo(() => (
    remaining > 0
      ? t('saved.progress', { months: remaining, total })
      : t('saved.completed')
  ), [remaining, t, total]);

  return (
    <View>
      {hasHeader ? (
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            {subtitle ? <Text style={styles.lender}>{subtitle}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
          </View>
          {headerAction}
        </View>
      ) : null}

      <Card style={styles.balanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.kicker}>{t('results.monthlyPayment')}</Text>
          {onShare ? (
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
          ) : null}
        </View>
        <Text style={styles.balance}>{formatCurrency(result.monthlyPayments, currency)}</Text>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('results.totalInterest')}</Text>
            <Text style={styles.statValue}>{formatCurrency(result.totalInterestPaid, currency)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('results.totalCost')}</Text>
            <Text style={styles.statValue}>{formatCurrency(result.totalAmountPaid, currency)}</Text>
          </View>
        </View>
        {mode === 'calculation' ? (
          <View style={styles.ratePill}>
            <Text style={styles.rateLabel}>{t('calculator.interestRate')}</Text>
            <Text style={styles.rateValue}>{result.interest}%</Text>
          </View>
        ) : null}
      </Card>

      {mode === 'saved' ? (
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.kicker}>{t('saved.loanProgress')}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} color={colours.teal} trackStyle={styles.progressTrack} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressCaption}>{t('mortgage.paidAmount', { amount: formatCurrency(paidSoFar, currency) })}</Text>
            <Text style={styles.progressCaption}>{t('mortgage.totalAmount', { amount: formatCurrency(principalAmount, currency) })}</Text>
          </View>
          <View style={styles.metricGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('mortgage.currentBalance')}</Text>
              <Text style={styles.metricValue}>{formatCurrency(currentBalance, currency)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('calculator.interestRate')}</Text>
              <Text style={styles.metricValue}>{result.interest}%</Text>
            </View>
          </View>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
        </Card>
      ) : (
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.kicker}>{t('results.costBreakdown')}</Text>
            <Text style={styles.progressPercent}>{payoffDate}</Text>
          </View>
          <View style={styles.breakdownTrack}>
            {breakdownSegments.map(segment => (
              <View
                key={segment.key}
                style={[
                  styles.breakdownSegment,
                  {
                    width: `${(segment.value / breakdownTotal) * 100}%`,
                    backgroundColor: segment.color,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.breakdownLegend}>
            {breakdownSegments.map(segment => (
              <View key={segment.key} style={styles.breakdownLegendItem}>
                <View style={[styles.breakdownDot, { backgroundColor: segment.color }]} />
                <Text style={styles.breakdownLegendLabel}>{segment.label}</Text>
                <Text style={styles.breakdownLegendValue}>{formatCurrency(segment.value, currency)}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {shouldShowSavings ? (
        <Card style={styles.savingsCard}>
          <Text style={styles.savingsTitle}>{t('saved.overpaymentSavings')}</Text>
          <Text style={styles.savingsAmount}>{formatCurrency(savingsAmount, currency)}</Text>
          <Text style={styles.savingsSubtitle}>{t('saved.savedInInterest')}</Text>
        </Card>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroCopy: { flex: 1, paddingRight: 12 },
  lender: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colours.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
  },
  balanceCard: { marginBottom: 14 },
  cardHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  kicker: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.textPrimary,
    textTransform: 'uppercase',
  },
  shareAction: {
    minHeight: 30,
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
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
  balance: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: 18,
  },
  statRow: { flexDirection: 'row', gap: 20 },
  stat: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
  },
  ratePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.button,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  rateLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
  },
  rateValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colours.primary,
  },
  progressCard: { marginBottom: 14 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressPercent: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colours.secondary,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressCaption: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radii.input,
    backgroundColor: colours.white,
    padding: 12,
  },
  metricLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
  },
  metricValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colours.primary,
    marginTop: 4,
  },
  breakdownTrack: {
    height: 14,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colours.surfaceStrong,
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLegend: {
    marginTop: 14,
    gap: 9,
  },
  breakdownLegendItem: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownLegendLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
  },
  breakdownLegendValue: {
    maxWidth: 150,
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
    textAlign: 'right',
  },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    marginTop: 14,
  },
  savingsCard: {
    backgroundColor: colours.successSurface,
    borderColor: colours.successBorder,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  savingsTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.secondary,
    marginBottom: 4,
  },
  savingsAmount: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.secondary,
  },
  savingsSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.secondary,
    marginTop: 2,
  },
});
