import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DealEditorForm } from '@/components/loans/DealEditorForm';
import { formatCurrency } from '@/currency/format';
import {
  canActivateDeal,
  canDeleteDeal,
  canEditDeal,
  formatDealDuration,
  getChronologicalDeals,
  getDealOverpaymentImpact,
  getMortgageTermInMonths,
  getNextDealStartDate,
  normaliseDealChain,
  removeLatestDealAndEvents,
  withMortgageTermInMonths,
} from '@/mortgage/tracker';
import { savedLoansStorage } from '@/storage/savedLoans';
import { LoanDeal } from '@/types/SavedLoan';
import { colours, radii, spacing } from '@/theme';
import { formatFriendlyDateRange } from '@/utils/date';

export default function EditDealScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id, dealId, correct } = useLocalSearchParams<{ id: string; dealId: string; correct?: string }>();
  const loan = savedLoansStorage.getById(id);
  const deal = loan?.deals.find(item => item.id === dealId);

  if (!loan || !deal) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('mortgage.editDeal')}
          variant="editor"
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <View style={styles.notFound}>
          <AppText variant="title3" style={styles.notFoundText}>{t('saved.notFound')}</AppText>
          <Button label={t('common.goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isCorrectionMode = deal.status === 'completed' && correct === '1';
  const chronologicalDeals = getChronologicalDeals(loan);
  const dealIndex = chronologicalDeals.findIndex(item => item.id === deal.id);
  const previousDeal = dealIndex > 0 ? chronologicalDeals[dealIndex - 1] : undefined;
  const fixedStartDate = previousDeal ? getNextDealStartDate(previousDeal, loan.formSnapshot.startDate) : undefined;
  const isInitialDeal = chronologicalDeals[0]?.id === deal.id;
  const dealIsEditable = canEditDeal(loan, deal.id);
  const canEditMortgageTerm = isInitialDeal && dealIsEditable;

  const deleteLatestDeal = () => {
    if (!canDeleteDeal(loan, deal.id)) return;

    Alert.alert(
      t('mortgage.deleteDealTitle'),
      t('mortgage.deleteDealMessage', { name: deal.name }),
      [
        { text: t('results.cancelLeave'), style: 'cancel' },
        {
          text: t('mortgage.deleteDeal'),
          style: 'destructive',
          onPress: () => {
            savedLoansStorage.update(removeLatestDealAndEvents(loan, deal.id));
            router.back();
          },
        },
      ],
    );
  };

  const saveDeal = (updatedDeal: LoanDeal, updatedMortgageTermInMonths?: number) => {
    if (!canEditDeal(loan, updatedDeal.id)) {
      Alert.alert(t('mortgage.dealLockedByLaterTitle'), t('mortgage.dealLockedByLaterBody'));
      return;
    }

    const loanWithTerm = updatedMortgageTermInMonths
      ? withMortgageTermInMonths(loan, updatedMortgageTermInMonths)
      : loan;
    const nextLoan = {
      ...loanWithTerm,
      deals: loanWithTerm.deals.map(item => item.id === updatedDeal.id ? updatedDeal : item),
    };

    savedLoansStorage.update(normaliseDealChain(nextLoan, updatedDeal.id));
    router.back();
  };

  if (!dealIsEditable) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('mortgage.dealDetails')}
          subtitle={deal.name}
          subtitleVariant="context"
          variant="detail"
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.readOnlyCard}>
            <AppText variant="labelMd" tone="muted" style={styles.readOnlyKicker}>{t('mortgage.dealLockedByLaterTitle')}</AppText>
            <AppText variant="title1" tone="accent" style={styles.readOnlyTitle}>{deal.name}</AppText>
            <AppText variant="bodySm" tone="muted" style={styles.readOnlyMeta}>
              {formatFriendlyDateRange(deal.startDate, deal.endDate, i18n.language)}
            </AppText>
            <View style={styles.readOnlyGrid}>
              <ReadOnlyMetric label={t('calculator.interestRate')} value={`${deal.interestRate}%`} />
              <ReadOnlyMetric label={t('mortgage.duration')} value={formatDealDuration(deal, i18n.language)} />
              <ReadOnlyMetric label={t('results.monthlyPayment')} value={formatCurrency(deal.monthlyPayment, loan.currency)} />
              <ReadOnlyMetric label={t('mortgage.openingBankBalance')} value={formatCurrency(deal.openingBalance, loan.currency)} />
            </View>
            <AppText variant="bodySm" tone="muted" style={styles.readOnlyNotes}>
              {t('mortgage.dealLockedByLaterBody')}
            </AppText>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (deal.status === 'completed' && !isCorrectionMode) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('mortgage.dealDetails')}
          subtitle={deal.name}
          subtitleVariant="context"
          variant="detail"
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.readOnlyCard}>
            <AppText variant="labelMd" tone="muted" style={styles.readOnlyKicker}>{t('saved.completed')}</AppText>
            <AppText variant="title1" tone="accent" style={styles.readOnlyTitle}>{deal.name}</AppText>
            <AppText variant="bodySm" tone="muted" style={styles.readOnlyMeta}>
              {formatFriendlyDateRange(deal.startDate, deal.endDate)}
            </AppText>
            <View style={styles.readOnlyGrid}>
              <ReadOnlyMetric label={t('calculator.interestRate')} value={`${deal.interestRate}%`} />
              <ReadOnlyMetric label={t('mortgage.duration')} value={formatDealDuration(deal, i18n.language)} />
              <ReadOnlyMetric label={t('results.monthlyPayment')} value={formatCurrency(deal.monthlyPayment, loan.currency)} />
              <ReadOnlyMetric label={t('mortgage.openingBankBalance')} value={formatCurrency(deal.openingBalance, loan.currency)} />
              <ReadOnlyMetric
                label={t('mortgage.closingBankBalance')}
                value={formatCurrency(deal.completion?.closingBalance ?? 0, loan.currency)}
              />
            </View>
            {(() => {
              const impact = getDealOverpaymentImpact(deal, loan.events);
              if (!impact.hasOverpayments) return null;
              return (
                <View style={styles.readOnlySavings}>
                  <ReadOnlyMetric
                    label={t('mortgage.dealInterestSaved')}
                    value={formatCurrency(impact.interestSaved, loan.currency)}
                    tone="accent"
                  />
                  <ReadOnlyMetric
                    label={t('mortgage.dealExtraPrincipal')}
                    value={formatCurrency(impact.extraPrincipalRepaid, loan.currency)}
                    tone="accent"
                  />
                  <ReadOnlyMetric
                    label={t('mortgage.dealOverpaymentsApplied')}
                    value={formatCurrency(impact.totalOverpayments, loan.currency)}
                    tone="accent"
                  />
                </View>
              );
            })()}
            {deal.completion?.notes ? (
              <AppText variant="bodySm" style={styles.readOnlyNotes}>{deal.completion.notes}</AppText>
            ) : null}
          </Card>
          <Button
            label={t('mortgage.editDeal')}
            onPress={() => router.replace(`/saved/${loan.id}/deals/${deal.id}?correct=1`)}
            variant="secondary"
            style={styles.correctAction}
          />
          {canDeleteDeal(loan, deal.id) ? (
            <Button
              label={t('mortgage.deleteDeal')}
              onPress={deleteLatestDeal}
              variant="destructive"
              style={styles.correctAction}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={isCorrectionMode ? t('mortgage.editDeal') : undefined}
        variant="editor"
        leftAction={<HeaderBackAction onPress={() => router.back()} />}
      />
      <DealEditorForm
        currency={loan.currency}
        initialDeal={deal}
        canPublish={canActivateDeal(loan, deal.id)}
        fixedStartDate={fixedStartDate}
        mortgageStartDate={loan.formSnapshot.startDate}
        mortgageTermInMonths={getMortgageTermInMonths(loan)}
        isInitialDeal={isInitialDeal}
        canEditMortgageTerm={canEditMortgageTerm}
        showSectionTabs={!isCorrectionMode}
        onCancel={() => router.back()}
        onSave={saveDeal}
        onDeleteDraft={deal.status === 'draft' && canDeleteDeal(loan, deal.id) ? () => {
          Alert.alert(
            t('mortgage.deleteDraftTitle'),
            t('mortgage.deleteDraftMessage'),
            [
              { text: t('results.cancelLeave'), style: 'cancel' },
              {
                text: t('mortgage.deleteDraft'),
                style: 'destructive',
                onPress: () => {
                  savedLoansStorage.update(removeLatestDealAndEvents(loan, deal.id));
                  router.back();
                },
              },
            ],
          );
        } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: 16, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFoundText: { marginBottom: 16 },
  readOnlyCard: { marginBottom: spacing.md },
  readOnlyKicker: {
    textTransform: 'uppercase',
  },
  readOnlyTitle: {
    marginTop: spacing.xs,
  },
  readOnlyMeta: {
    marginTop: spacing.xs,
  },
  readOnlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  readOnlySavings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  readOnlyMetric: {
    width: '47%',
    borderWidth: 1,
    borderColor: colours.borderSoft,
    borderRadius: radii.input,
    backgroundColor: colours.surfaceRaised,
    padding: spacing.sm,
  },
  readOnlyMetricAccent: {
    borderColor: colours.successBorder,
    backgroundColor: colours.successSurface,
  },
  readOnlyLabel: {
    textTransform: 'uppercase',
  },
  readOnlyValue: {
    marginTop: spacing.xs,
  },
  readOnlyNotes: {
    lineHeight: 20,
    marginTop: spacing.md,
  },
  correctAction: { marginTop: spacing.sm },
});

const ReadOnlyMetric = ({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'accent';
}) => (
  <View style={[styles.readOnlyMetric, tone === 'accent' && styles.readOnlyMetricAccent]}>
    <AppText variant="labelSm" tone="muted" style={styles.readOnlyLabel}>{label}</AppText>
    <AppText
      variant="title3"
      tone={tone === 'accent' ? 'success' : 'accent'}
      style={styles.readOnlyValue}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </AppText>
  </View>
);
