import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { savedLoansStorage } from '@/storage/savedLoans';
import { LoanCalculationView } from '@/components/calculator/LoanCalculationView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colours, fonts, fontSizes, fontWeights, layout, radii, spacing } from '@/theme';
import { formatCurrency } from '@/currency/format';
import { monthsBetween } from '@/utils/date';
import { getResultForSavedLoan } from '@/results/loanResultRoute';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MortgageGroupDetail } from '@/components/loans/MortgageGroupDetail';
import { DashboardPinButton } from '@/components/loans/DashboardPinButton';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function LoanDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { id, fromSave } = useLocalSearchParams<{ id: string; fromSave?: string }>();
  const [loan, setLoan] = useState(() => savedLoansStorage.getById(id));
  const allowSavedBackRef = useRef(false);

  const refresh = useCallback(() => {
    setLoan(savedLoansStorage.getById(id));
  }, [id]);

  useFocusEffect(refresh);

  const handleBack = useCallback(() => {
    if (fromSave !== '1') {
      router.back();
      return;
    }

    allowSavedBackRef.current = true;
    router.replace('/saved');
    setTimeout(() => {
      allowSavedBackRef.current = false;
    }, 0);
  }, [fromSave, router]);

  useEffect(() => {
    if (fromSave !== '1') return undefined;

    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowSavedBackRef.current) return;
      event.preventDefault();
      handleBack();
    });

    return unsubscribe;
  }, [fromSave, handleBack, navigation]);

  const result = useMemo(() => {
    if (!loan) return null;
    return getResultForSavedLoan(loan);
  }, [loan]);

  if (!loan || !result) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('saved.loanDetail')}
          leftAction={<HeaderBackAction onPress={handleBack} />}
        />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('saved.notFound')}</Text>
          <Button label={t('common.goBack')} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const elapsed = Math.max(0, monthsBetween(loan.formSnapshot.startDate, now));
  const total = loan.resultSnapshot.totalTermInMonths;
  const progress = total > 0 ? Math.min(elapsed / total, 1.0) : 0;
  const remaining = Math.max(0, total - elapsed);
  const hasSavings = (loan.formSnapshot.additionalMonthlyPayment ?? 0) > 0;
  const savings = loan.resultSnapshot.totalInterestPaidBaseline - loan.resultSnapshot.totalInterestPaid;
  const principalAmount = result.amount - result.downPayment;
  const currentBalanceIndex = Math.min(elapsed, result.tableItems.length) - 1;
  const currentBalanceCandidate = currentBalanceIndex >= 0
    ? Number(result.tableItems[currentBalanceIndex]?.ending ?? principalAmount)
    : principalAmount;
  const currentBalance = Number.isFinite(currentBalanceCandidate) ? currentBalanceCandidate : principalAmount;
  const paidSoFar = Math.max(0, principalAmount - currentBalance);

  if (loan.category === 'mortgage') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('saved.loanDetail')}
          leftAction={<HeaderBackAction onPress={handleBack} />}
        />
        <ScrollView contentContainerStyle={styles.container}>
          <MortgageGroupDetail
            loan={loan}
            onTogglePinned={() => {
              savedLoansStorage.togglePinned(loan.id);
              refresh();
            }}
          />
          <View style={styles.calculationSection}>
            <Text style={styles.sectionTitle}>{t('results.title')}</Text>
            <LoanCalculationView
              result={result}
              startDate={loan.formSnapshot.startDate}
              currency={loan.currency}
            />
          </View>
          <Button
            label={t('edit.manageShort')}
            onPress={() => router.push(`/saved/${id}/edit`)}
            variant="secondary"
            style={styles.secondaryAction}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={t('saved.loanDetail')}
        leftAction={<HeaderBackAction onPress={handleBack} />}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.lender}>{loan.lender || t('saved.category.loan')}</Text>
            <Text style={styles.nickname}>{loan.nickname}</Text>
          </View>
          <DashboardPinButton
            pinned={loan.pinnedToDashboard}
            onPress={() => {
              savedLoansStorage.togglePinned(loan.id);
              refresh();
            }}
            style={styles.pinButton}
          />
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.kicker}>{t('results.monthlyPayment')}</Text>
          <Text style={styles.balance}>{formatCurrency(result.monthlyPayments, loan.currency)}</Text>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('results.totalInterest')}</Text>
              <Text style={styles.statValue}>{formatCurrency(result.totalInterestPaid, loan.currency)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('results.totalCost')}</Text>
              <Text style={styles.statValue}>{formatCurrency(result.totalAmountPaid, loan.currency)}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.kicker}>{t('saved.loanProgress')}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} color={colours.teal} trackStyle={styles.progressTrack} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressCaption}>{t('mortgage.paidAmount', { amount: formatCurrency(paidSoFar, loan.currency) })}</Text>
            <Text style={styles.progressCaption}>{t('mortgage.totalAmount', { amount: formatCurrency(principalAmount, loan.currency) })}</Text>
          </View>
          <View style={styles.metricGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('mortgage.currentBalance')}</Text>
              <Text style={styles.metricValue}>{formatCurrency(currentBalance, loan.currency)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('calculator.interestRate')}</Text>
              <Text style={styles.metricValue}>{loan.formSnapshot.interest}%</Text>
            </View>
          </View>
          <Text style={styles.progressLabel}>
            {remaining > 0
              ? t('saved.progress', { months: remaining, total })
              : t('saved.completed')}
          </Text>
        </Card>

        {hasSavings && savings > 0 && (
          <Card style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>{t('saved.overpaymentSavings')}</Text>
            <Text style={styles.savingsAmount}>
              {formatCurrency(savings, loan.currency)}
            </Text>
            <Text style={styles.savingsSubtitle}>{t('saved.savedInInterest')}</Text>
          </Card>
        )}

        <View style={styles.calculationSection}>
          <Text style={styles.sectionTitle}>{t('results.title')}</Text>
          <LoanCalculationView
            result={result}
            startDate={loan.formSnapshot.startDate}
            currency={loan.currency}
          />
        </View>

        <Button
          label={t('edit.manageShort')}
          onPress={() => router.push(`/saved/${id}/edit`)}
          variant="secondary"
          style={styles.secondaryAction}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: layout.screenPadding, paddingBottom: spacing['3xl'] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFoundText: { fontFamily: fonts.heading, fontSize: fontSizes.md, color: colours.textPrimary, marginBottom: 16 },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroCopy: { flex: 1, paddingRight: 12 },
  pinButton: {
    marginBottom: 0,
    marginTop: 4,
  },
  nickname: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
  },
  lender: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colours.textSecondary,
    marginBottom: 4,
  },
  balanceCard: { marginBottom: 14 },
  kicker: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.textPrimary,
    textTransform: 'uppercase',
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
  stat: { flex: 1 },
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
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colours.primary,
    marginBottom: 14,
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
  calculationSection: {
    marginTop: 8,
    marginBottom: 6,
  },
  secondaryAction: {
    marginTop: 8,
  },
});
