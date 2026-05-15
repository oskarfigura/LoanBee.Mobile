import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLoanCalculations } from '@/core/amortisation';
import { DownPaymentType } from '@/core/DownPaymentType';
import { LoanCalculationType } from '@/core/LoanCalculationType';
import { formatCurrency } from '@/currency/format';
import { buildResultSnapshot } from '@/loans/loanGroupFactory';
import { savedLoansStorage } from '@/storage/savedLoans';
import { colours, layout, radii, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppTextInput, FieldLabel, InputSurface } from '@/components/ui/FormPrimitives';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const formatDuration = (totalMonths: number, yrsLabel: string, moLabel: string): string => {
  const years = Math.floor(Math.abs(totalMonths) / 12);
  const months = Math.abs(totalMonths) % 12;
  if (years === 0) return `${months} ${moLabel}`;
  if (months === 0) return `${years} ${yrsLabel}`;
  return `${years} ${yrsLabel} ${months} ${moLabel}`;
};

export default function RecalculateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = savedLoansStorage.getById(id);

  const savedOverpayment = loan?.formSnapshot.additionalMonthlyPayment ?? 0;
  const [overpayment, setOverpayment] = useState(
    savedOverpayment > 0 ? String(savedOverpayment) : '',
  );

  const overpaymentAmount = parseFloat(overpayment) || 0;

  const { baselineResult, scenarioResult } = useMemo(() => {
    if (!loan) return { baselineResult: null, scenarioResult: null };
    const form = loan.formSnapshot;
    const calcType = form.calculationType.toLowerCase() as LoanCalculationType;
    const dpType = form.downPaymentType.toLowerCase() as DownPaymentType;

    return {
      baselineResult: getLoanCalculations(
        form.loanAmount, form.interest, form.termInYears, form.termInMonths,
        form.desiredMonthlyPayment ?? 0, calcType, form.downPayment, dpType,
        0, form.startDate,
      ),
      scenarioResult: getLoanCalculations(
        form.loanAmount, form.interest, form.termInYears, form.termInMonths,
        form.desiredMonthlyPayment ?? 0, calcType, form.downPayment, dpType,
        overpaymentAmount, form.startDate,
      ),
    };
  }, [loan, overpaymentAmount]);

  if (!loan || !baselineResult || !scenarioResult) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('recalculate.title')}
          variant="editor"
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <View style={styles.notFound}>
          <AppText variant="title3">{t('saved.notFound')}</AppText>
          <Button label={t('common.goBack')} onPress={() => router.back()} style={styles.notFoundBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const interestSaved = baselineResult.totalInterestPaid - scenarioResult.totalInterestPaid;
  const monthsSaved = baselineResult.tableItems.length - scenarioResult.tableItems.length;
  const hasImpact = overpaymentAmount > 0;
  const isUnchanged = overpaymentAmount === savedOverpayment;

  const handleSave = () => {
    savedLoansStorage.update({
      ...loan,
      formSnapshot: { ...loan.formSnapshot, additionalMonthlyPayment: overpaymentAmount },
      resultSnapshot: buildResultSnapshot(scenarioResult, loan.resultSnapshot.totalInterestPaidBaseline),
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  const yrs = t('results.years');
  const mo = t('results.months');
  const termLabel = formatDuration(
    (loan.formSnapshot.termInYears * 12) + loan.formSnapshot.termInMonths,
    yrs,
    mo,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={t('recalculate.title')}
        subtitle={t('recalculate.subtitle')}
        variant="editor"
        leftAction={<HeaderBackAction onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.summaryCard}>
          <AppText variant="title3">{t('recalculate.loanSummaryTitle')}</AppText>
          <View style={styles.summaryRows}>
            <SummaryRow
              label={t('calculator.loanAmount')}
              value={formatCurrency(loan.formSnapshot.loanAmount, loan.currency)}
            />
            <SummaryRow
              label={t('calculator.interestRate')}
              value={`${loan.formSnapshot.interest}%`}
            />
            <SummaryRow label={t('results.loanTerm')} value={termLabel} />
            <SummaryRow
              label={t('results.monthlyPayment')}
              value={formatCurrency(baselineResult.monthlyPayments, loan.currency)}
            />
          </View>
        </Card>

        <View style={styles.inputSection}>
          <FieldLabel>{t('recalculate.extraPaymentLabel')}</FieldLabel>
          <InputSurface>
            <AppTextInput
              value={overpayment}
              onChangeText={setOverpayment}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </InputSurface>
        </View>

        {hasImpact ? (
          <Card style={styles.impactCard}>
            <AppText variant="title3">{t('recalculate.impactTitle')}</AppText>
            <View style={styles.impactRows}>
              <ImpactRow
                label={t('recalculate.interestSaved')}
                value={formatCurrency(interestSaved, loan.currency)}
                positive={interestSaved > 0}
              />
              <ImpactRow
                label={t('recalculate.timeSaved')}
                value={monthsSaved > 0 ? formatDuration(monthsSaved, yrs, mo) : '—'}
                positive={monthsSaved > 0}
              />
              <ImpactRow
                label={t('recalculate.newMonthlyTotal')}
                value={formatCurrency(scenarioResult.monthlyPayments + overpaymentAmount, loan.currency)}
              />
            </View>
          </Card>
        ) : (
          <View style={styles.emptyState}>
            <AppText variant="bodySm" tone="muted" style={styles.emptyStateText}>
              {t('recalculate.noImpactMessage')}
            </AppText>
          </View>
        )}

        <Button
          label={t('recalculate.saveToLoan')}
          onPress={handleSave}
          disabled={isUnchanged}
          style={styles.saveBtn}
        />
        <Button
          label={t('save.cancel')}
          onPress={() => router.back()}
          variant="ghost"
          style={styles.cancelBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <AppText variant="bodySm" tone="muted">{label}</AppText>
    <AppText variant="bodySm">{value}</AppText>
  </View>
);

const ImpactRow = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
  <View style={styles.impactRow}>
    <AppText variant="bodySm" tone="muted">{label}</AppText>
    <AppText variant="labelMd" tone={positive ? 'success' : 'default'}>{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: layout.screenPadding, paddingBottom: spacing['3xl'] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFoundBtn: { marginTop: spacing.md },
  summaryCard: { marginTop: spacing.md },
  summaryRows: { marginTop: spacing.sm, gap: spacing.xs },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputSection: { marginTop: spacing.lg, gap: spacing.xs },
  impactCard: {
    marginTop: spacing.lg,
    borderColor: colours.successBorder,
    backgroundColor: colours.successSurface,
  },
  impactRows: { marginTop: spacing.sm, gap: spacing.sm },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyState: {
    marginTop: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colours.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: { textAlign: 'center' },
  saveBtn: { marginTop: spacing.xl },
  cancelBtn: { marginTop: spacing.xs },
});
