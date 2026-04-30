import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/currency/format';
import { CurrencyCode } from '@/currency/currencies';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';

interface Props {
  monthlyPayments: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  termInYears: number;
  termInMonths: number;
  startDate: string;
  currency: CurrencyCode;
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
  totalInterestPaid,
  totalAmountPaid,
  termInYears,
  termInMonths,
  startDate,
  currency,
}: Props) => {
  const { t, i18n } = useTranslation();

  const termLabel = [
    termInYears > 0 ? `${termInYears} ${t('results.years')}` : '',
    termInMonths > 0 ? `${termInMonths} ${t('results.months')}` : '',
  ].filter(Boolean).join(` ${t('results.and')} `) || '—';
  const payoffDate = formatPayoffDate(startDate, termInYears, termInMonths, i18n.language);

  return (
    <View style={styles.container}>
      <Card style={styles.heroCard} padding={18}>
        <Text style={styles.heroLabel}>{t('results.monthlyPayment')}</Text>
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
        <SummaryCard
          label={t('results.totalInterest')}
          value={formatCurrency(totalInterestPaid, currency)}
        />
        <View style={styles.spacer} />
        <SummaryCard
          label={t('results.totalCost')}
          value={formatCurrency(totalAmountPaid, currency)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heroCard: {
    backgroundColor: colours.primary,
  },
  heroLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colours.whiteSubtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroValue: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.white,
    marginBottom: 18,
  },
  heroMeta: {
    flexDirection: 'row',
    backgroundColor: colours.primaryDark,
    borderRadius: 14,
    paddingVertical: 12,
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
  spacer: { width: 10 },
});
