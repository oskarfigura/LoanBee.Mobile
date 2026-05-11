import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/currency/format';
import { getMortgageTrackerSummary } from '@/mortgage/tracker';
import { buildSavedLoanSummary } from '@/loans/loanInsightSummary';
import { getResultForSavedLoan } from '@/results/loanResultRoute';
import { MortgageEvent, SavedLoan } from '@/types/SavedLoan';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';
import { DashboardPinButton } from '@/components/loans/DashboardPinButton';
import { LoanInsightCard } from '@/components/loans/LoanInsightCard';
import { MortgageTimelineView } from '@/components/loans/MortgageTimelineView';
import { SavedLoanProgressBar } from '@/components/loans/SavedLoanProgressBar';

interface Props {
  loan: SavedLoan;
  onTogglePinned: () => void;
}

const eventTitle = (event: MortgageEvent) => {
  if (event.type === 'lumpOverpayment') return 'Lump overpayment';
  if (event.type === 'missedPayment') return 'Missed payment';
  if (event.type === 'paymentHoliday') return 'Payment holiday';
  if (event.type === 'balanceCheckpoint') return 'Bank balance checkpoint';
  return 'Note';
};

export const MortgageGroupDetail = ({ loan, onTogglePinned }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const summary = getMortgageTrackerSummary(loan);
  const currentDeal = summary.currentDeal;
  const result = useMemo(() => getResultForSavedLoan(loan), [loan]);
  const insightSummary = useMemo(() => (
    buildSavedLoanSummary(loan, result, new Date())
  ), [loan, result]);

  return (
    <View>
      <LoanInsightCard
        summary={insightSummary}
        density="full"
        title={loan.nickname}
        subtitle={loan.lender || currentDeal?.lender || t('saved.category.mortgage')}
        headerAction={(
          <DashboardPinButton
            pinned={loan.pinnedToDashboard}
            onPress={onTogglePinned}
            style={styles.pinButton}
          />
        )}
        showProgress
        progressContent={<SavedLoanProgressBar loan={loan} result={result} summary={insightSummary} />}
      />

      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>{t('mortgage.dealTimeline')}</Text>
        <MortgageTimelineView loan={loan} showFooterAction={false} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('mortgage.recentEvents')}</Text>
        {summary.recentEvents.length > 0 ? summary.recentEvents.map(event => (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.eventIcon}>
              <Text style={styles.eventIconText}>{event.type === 'balanceCheckpoint' ? 'B' : '+'}</Text>
            </View>
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle}>{eventTitle(event)}</Text>
              <Text style={styles.eventMeta}>
                {event.balance !== undefined
                  ? formatCurrency(event.balance, loan.currency)
                  : event.amount !== undefined
                    ? formatCurrency(event.amount, loan.currency)
                    : event.note || event.date}
              </Text>
            </View>
            <Text style={styles.eventDate}>{event.date}</Text>
          </View>
        )) : (
          <Text style={styles.empty}>{t('mortgage.noEventsYet')}</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Button label={t('mortgage.recordBalance')} onPress={() => router.push(`/saved/${loan.id}/events/new?type=balanceCheckpoint`)} variant="secondary" style={styles.action} />
        <Button label={t('mortgage.addOverpayment')} onPress={() => router.push(`/saved/${loan.id}/events/new?type=lumpOverpayment`)} variant="secondary" style={styles.action} />
        <Button label={t('mortgage.addNextDeal')} onPress={() => router.push(`/saved/${loan.id}/deals/new`)} variant="secondary" style={styles.action} />
        <Button label={t('mortgage.completeCurrentDeal')} onPress={() => router.push(`/saved/${loan.id}/complete-current`)} variant="secondary" style={styles.action} />
      </View>
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
  pinButton: {
    marginBottom: 0,
    marginTop: 4,
  },
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
  card: { marginBottom: 14 },
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
  statSuffix: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metric: { flex: 1 },
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
  timelineSection: {
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.focusRing,
  },
  eventIconText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colours.primary,
  },
  eventCopy: { flex: 1 },
  eventTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colours.textPrimary,
  },
  eventMeta: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    marginTop: 3,
  },
  eventDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  action: { flexBasis: '100%', flexGrow: 1 },
});
