import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSavedLoans } from '@/hooks/useSavedLoans';
import { LoanProfileCard } from '@/components/loans/LoanProfileCard';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { AppTextInput, InputSurface } from '@/components/ui/FormPrimitives';
import { SearchIcon } from '@/components/ui/Icons/SearchIcon/SearchIcon';
import { formatCurrency } from '@/currency/format';
import { buildRecentResultParams, getResultForFormValues } from '@/results/loanResultRoute';
import { RecentCalculation, recentCalculationsStorage } from '@/storage/recentCalculations';
import { colours, layout, spacing } from '@/theme';
import { formatFriendlyDate } from '@/utils/date';
import { SafeAreaView } from 'react-native-safe-area-context';

const RecentCalculationCard = ({
  item,
  onOpen,
  onTrack,
  onDelete,
}: {
  item: RecentCalculation;
  onOpen: () => void;
  onTrack: () => void;
  onDelete: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const result = useMemo(() => getResultForFormValues(item.formValues), [item.formValues]);

  return (
    <Card style={styles.recentCard} padding={layout.cardPadding}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.84}>
        <View style={styles.recentCardHeader}>
          <View style={styles.recentCardCopy}>
            <AppText variant="labelSm" tone="muted" style={styles.kicker}>
              {item.category ? t(`saved.category.${item.category}`) : t('recent.calculation')}
            </AppText>
            <AppText variant="title3">
              {formatCurrency(result.monthlyPayments, item.currency)}
            </AppText>
            <AppText variant="bodySm" tone="muted">
              {t('recent.created', { date: formatFriendlyDate(item.createdAt.slice(0, 10), i18n.language) })}
            </AppText>
          </View>
          <View style={styles.recentMetric}>
            <AppText variant="helper" tone="muted">{t('results.totalInterest')}</AppText>
            <AppText variant="labelMd" tone="accent" numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(result.totalInterestPaid, item.currency)}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.recentActions}>
        <Button label={t('recent.reopen')} onPress={onOpen} variant="secondary" style={styles.recentAction} />
        <Button label={t('recent.track')} onPress={onTrack} style={styles.recentAction} />
        <Button label={t('common.delete')} onPress={onDelete} variant="ghost" style={styles.recentDeleteAction} />
      </View>
    </Card>
  );
};

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromDashboard?: string }>();
  const { loans, togglePinned, refresh } = useSavedLoans();
  const openedFromDashboard = params.fromDashboard === '1';

  const [query, setQuery] = useState('');
  const [recentItems, setRecentItems] = useState(() => recentCalculationsStorage.getAll());
  const visibleLoans = useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalisedQuery
      ? loans.filter(loan => [
        loan.nickname,
        loan.lender ?? '',
        t(`saved.category.${loan.category}`),
      ].some(value => value.toLocaleLowerCase().includes(normalisedQuery)))
      : loans;

    return [...filtered].sort((a, b) => {
      // Pinned loans float to the top so the list order matches the prominence the
      // pin implies; within each group fall back to most-recently-updated first.
      if (a.pinnedToDashboard !== b.pinnedToDashboard) {
        return a.pinnedToDashboard ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [loans, query, t]);

  const refreshScreen = useCallback(() => {
    refresh();
    setRecentItems(recentCalculationsStorage.getAll());
  }, [refresh]);

  useFocusEffect(refreshScreen);

  const openRecent = useCallback((id: string) => {
    router.push({
      pathname: '/result' as never,
      params: buildRecentResultParams(id),
    });
  }, [router]);

  const trackRecent = useCallback((item: RecentCalculation) => {
    router.push({
      pathname: '/saved/new' as never,
      params: {
        recentId: item.id,
        currency: item.currency,
      },
    });
  }, [router]);

  const deleteRecent = useCallback((id: string) => {
    recentCalculationsStorage.remove(id);
    setRecentItems(recentCalculationsStorage.getAll());
  }, []);

  const recentFooter = recentItems.length > 0 ? (
    <View style={styles.recentSection}>
      <View style={styles.recentSectionHeader}>
        <AppText variant="title2">{t('recent.title')}</AppText>
        <AppText variant="bodySm" tone="muted">
          {t('recent.intro')}
        </AppText>
      </View>
      {recentItems.map(item => (
        <RecentCalculationCard
          key={item.id}
          item={item}
          onOpen={() => openRecent(item.id)}
          onTrack={() => trackRecent(item)}
          onDelete={() => deleteRecent(item.id)}
        />
      ))}
    </View>
  ) : null;

  return (
    // No 'bottom' edge: this screen sits above the tab bar, which owns the bottom inset.
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScreenHeader
        title={t('saved.title')}
        variant="top-level"
        leftAction={openedFromDashboard ? (
          <HeaderBackAction onPress={() => router.replace('/')} />
        ) : undefined}
      />
      <FlatList
        data={visibleLoans}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loans.length === 0 ? (
            <EmptyState title={t('saved.empty')} subtitle={t('saved.emptySubtitle')} />
          ) : (
            <EmptyState title={t('saved.noMatches')} />
          )
        }
        ListHeaderComponent={(
          <View style={styles.headerAction}>
            <AppText variant="bodyLg" tone="muted" style={styles.intro}>
              {t('saved.intro')}
            </AppText>
            <View style={styles.headerButtons}>
              <Button
                label={t('saved.createNewCalculation')}
                onPress={() => router.push({
                  pathname: '/' as never,
                  params: { calculator: '1' },
                })}
                variant="secondary"
                style={styles.headerButton}
              />
            </View>
            {loans.length > 0 ? (
              <View style={styles.controls}>
                <InputSurface>
                  <SearchIcon size={18} color={colours.textSecondary} strokeWidth={1.9} />
                  <AppTextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('saved.searchPlaceholder')}
                    returnKeyType="search"
                    style={styles.searchInput}
                  />
                </InputSurface>
              </View>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <LoanProfileCard
            loan={item}
            onPress={() => router.push(
              item.status === 'draft' ? `/saved/track?id=${item.id}` : `/saved/${item.id}`,
            )}
            onTogglePinned={() => togglePinned(item.id)}
          />
        )}
        ListFooterComponent={recentFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  list: {
    padding: layout.screenPadding,
    flexGrow: 1,
  },
  headerAction: {
    marginBottom: spacing.md,
  },
  intro: {
    marginBottom: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  headerButton: {
    flexGrow: 1,
    flexBasis: '100%',
  },
  controls: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchInput: {
    marginLeft: spacing.xs,
  },
  recentSection: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  recentSectionHeader: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  recentCard: {
    marginBottom: spacing.md,
  },
  recentCardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recentCardCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  kicker: {
    textTransform: 'uppercase',
  },
  recentMetric: {
    width: 128,
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  recentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  recentAction: {
    flexGrow: 1,
    flexBasis: '40%',
  },
  recentDeleteAction: {
    flexGrow: 1,
    flexBasis: '100%',
  },
});
