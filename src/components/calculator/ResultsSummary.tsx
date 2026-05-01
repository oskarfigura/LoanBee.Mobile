import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/currency/format';
import { CurrencyCode } from '@/currency/currencies';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';

interface Props {
  monthlyPayments: number;
  principalAmount: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  termInYears: number;
  termInMonths: number;
  startDate: string;
  currency: CurrencyCode;
  onShare?: () => void;
  shareLabel?: string;
  shareIcon?: React.ReactNode;
}

const formatPayoffDate = (startDate: string, termInYears: number, termInMonths: number, language: string) => {
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return '—';

  date.setMonth(date.getMonth() + termInYears * 12 + termInMonths);

  return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  });
};

export const ResultsSummary = ({
  monthlyPayments,
  principalAmount,
  totalInterestPaid,
  totalAmountPaid,
  termInYears,
  termInMonths,
  startDate,
  currency,
  onShare,
  shareLabel,
  shareIcon,
}: Props) => {
  const { t, i18n } = useTranslation();

  const termLabel = [
    termInYears > 0 ? `${termInYears} ${t('results.years')}` : '',
    termInMonths > 0 ? `${termInMonths} ${t('results.months')}` : '',
  ].filter(Boolean).join(` ${t('results.and')} `) || '—';
  const payoffDate = formatPayoffDate(startDate, termInYears, termInMonths, i18n.language);
  const interestShare = totalAmountPaid > 0
    ? `${Math.round((totalInterestPaid / totalAmountPaid) * 100)}%`
    : '—';

  return (
    <View style={styles.container}>
      <Card style={styles.heroCard} padding={18}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>{t('results.monthlyPayment')}</Text>
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
        <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(monthlyPayments, currency)}
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('results.loanTerm')}</Text>
            <Text style={styles.metaValue} numberOfLines={1} adjustsFontSizeToFit>
              {termLabel}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('results.payoffDate')}</Text>
            <Text style={styles.metaValue} numberOfLines={1} adjustsFontSizeToFit>
              {payoffDate}
            </Text>
          </View>
        </View>
      </Card>
      <View style={styles.row}>
        <View style={styles.statPanel}>
          <Text style={styles.statLabel}>{t('results.totalInterest')}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalInterestPaid, currency)}
          </Text>
        </View>
        <View style={styles.spacer} />
        <View style={styles.statPanel}>
          <Text style={styles.statLabel}>{t('results.totalCost')}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalAmountPaid, currency)}
          </Text>
        </View>
      </View>
      <View style={styles.breakdownPanel}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>{t('results.principal')}</Text>
          <Text style={styles.breakdownValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(principalAmount, currency)}
          </Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>{t('results.totalInterest')}</Text>
          <Text style={styles.breakdownValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalInterestPaid, currency)}
          </Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>{t('results.interestShare')}</Text>
          <Text style={styles.breakdownValue}>{interestShare}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 9,
  },
  heroCard: {
    backgroundColor: colours.primary,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  heroLabel: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colours.whiteSubtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  shareAction: {
    minHeight: 30,
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colours.whiteSubtle,
    paddingHorizontal: 10,
  },
  shareIcon: {
    marginRight: 5,
  },
  shareText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colours.white,
  },
  heroValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.white,
    marginBottom: 16,
  },
  heroMeta: {
    flexDirection: 'row',
    backgroundColor: colours.primaryDark,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  metaItem: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    backgroundColor: colours.whiteSubtle,
    marginHorizontal: 12,
    opacity: 0.35,
  },
  metaLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: colours.whiteSubtle,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colours.white,
  },
  row: {
    flexDirection: 'row',
  },
  statPanel: {
    flex: 1,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 12,
    padding: 11,
  },
  statLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colours.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
  },
  spacer: { width: 10 },
  breakdownPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.white,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    height: 34,
    backgroundColor: colours.border,
    marginHorizontal: 10,
  },
  breakdownLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: colours.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  breakdownValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
  },
});
