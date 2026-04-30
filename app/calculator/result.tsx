import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ResultsSummary } from '@/components/calculator/ResultsSummary';
import { AmortisationTable } from '@/components/calculator/AmortisationTable';
import { RepaymentBarChart } from '@/components/charts/RepaymentBarChart';
import { LoanBreakdownDonut } from '@/components/charts/LoanBreakdownDonut';
import { CumulativeAreaChart } from '@/components/charts/CumulativeAreaChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FinancialDisclaimer } from '@/components/ui/FinancialDisclaimer';
import { BannerAd } from '@/ads/BannerAd';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';
import { CurrencyCode } from '@/currency/currencies';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoanResult = ReturnType<typeof import('@/core/amortisation').getLoanCalculations>;
type ResultTab = 'summary' | 'charts' | 'schedule';

export default function ResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ result: string; formValues: string; currency: string }>();

  const result = JSON.parse(params.result) as LoanResult;
  const formValues = JSON.parse(params.formValues);
  const currency = (params.currency as CurrencyCode) ?? 'GBP';

  const [activeTab, setActiveTab] = useState<ResultTab>('summary');

  const principalAmount = result.amount - result.downPayment;
  const tabs: Array<{ key: ResultTab; label: string }> = [
    { key: 'summary', label: t('results.summary') },
    { key: 'charts', label: t('results.charts') },
    { key: 'schedule', label: t('results.schedule') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FinancialDisclaimer />

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'summary' && (
          <View style={styles.tabPanel}>
            <ResultsSummary
              monthlyPayments={result.monthlyPayments}
              totalInterestPaid={result.totalInterestPaid}
              totalAmountPaid={result.totalAmountPaid}
              termInYears={result.termInYears}
              termInMonths={result.termInMonths}
              startDate={formValues.startDate}
              currency={currency}
            />
          </View>
        )}

        {activeTab === 'charts' && (
          <View style={styles.tabPanel}>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{t('results.repaymentBreakdown')}</Text>
              </View>
              <RepaymentBarChart
                monthlyArray={result.loanChartMonthlyArray}
                interestArray={result.loanChartInterestArray}
                labelArray={result.loanChartLabelArray}
                currency={currency}
              />
            </Card>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{t('results.loanBreakdown')}</Text>
              </View>
              <LoanBreakdownDonut
                principal={principalAmount}
                totalInterest={result.totalInterestPaid}
                currency={currency}
              />
            </Card>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{t('results.cumulativePayments')}</Text>
              </View>
              <CumulativeAreaChart
                monthlyArray={result.loanChartMonthlyArray}
                interestArray={result.loanChartInterestArray}
                remainingArray={result.loanChartRemainingArray}
                currency={currency}
              />
            </Card>
          </View>
        )}

        {activeTab === 'schedule' && (
          <Card style={[styles.chartCard, styles.scheduleCard]}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{t('results.amortisationTable')}</Text>
            </View>
            <AmortisationTable
              items={result.tableItems}
              startDate={formValues.startDate}
              currency={currency}
            />
          </Card>
        )}

        <Button
          label={t('results.saveThisLoan')}
          onPress={() => router.push({
            pathname: '/saved/new',
            params: {
              result: params.result,
              formValues: params.formValues,
              currency: params.currency,
            },
          })}
          style={styles.saveBtn}
        />
      </ScrollView>
      <View style={styles.adFooter}>
        <BannerAd />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 120 },
  adFooter: {
    backgroundColor: colours.white,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colours.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colours.border,
    marginTop: 16,
    marginBottom: 14,
    minHeight: 52,
    padding: 4,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colours.primary,
  },
  tabText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colours.textSecondary,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colours.white,
  },
  tabPanel: {
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colours.border,
  },
  chartHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  chartTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colours.textSecondary,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  saveBtn: {
    marginTop: 16,
  },
  scheduleCard: {
    paddingBottom: 8,
  },
});
