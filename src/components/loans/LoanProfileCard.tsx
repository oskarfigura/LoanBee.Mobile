import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { LoanInsightCard } from '@/components/loans/LoanInsightCard';
import { PinIcon } from '@/components/loans/LoanIcons';
import { buildSavedLoanSummary } from '@/loans/loanInsightSummary';
import { getResultForSavedLoan } from '@/results/loanResultRoute';
import { SavedLoan } from '@/types/SavedLoan';
import { colours, spacing } from '@/theme';

interface Props {
  loan: SavedLoan;
  onPress: () => void;
  onDelete: () => void;
  onTogglePinned: () => void;
}

export const LoanProfileCard = ({ loan, onPress, onDelete, onTogglePinned }: Props) => {
  const { t, i18n } = useTranslation();
  const summary = useMemo(() => {
    const result = getResultForSavedLoan(loan);
    return buildSavedLoanSummary(loan, result, new Date(), i18n.language);
  }, [i18n.language, loan]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LoanInsightCard
        summary={summary}
        density="compact"
        title={loan.nickname}
        subtitle={loan.lender || t(`saved.category.${loan.category}`)}
        headerAction={<Badge label={t(`saved.category.${loan.category}`)} />}
        footerContent={(
          <View style={styles.footer}>
            <AppText variant="helper" tone="muted">
              {t('saved.startedOn', { date: loan.formSnapshot.startDate })}
            </AppText>
            <View style={styles.footerActions}>
              <TouchableOpacity onPress={onTogglePinned} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={styles.pinBtn}>
                  <PinIcon color={colours.primary} size={14} />
                  <AppText variant="labelMd" tone="accent">
                    {loan.pinnedToDashboard ? t('mortgage.pinned') : t('mortgage.pinToDashboard')}
                  </AppText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppText variant="labelMd" tone="error">{t('saved.delete')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  footer: {
    gap: spacing.xs,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
