import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSavedLoans } from '@/hooks/useSavedLoans';
import { LoanProfileCard } from '@/components/loans/LoanProfileCard';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { AppTextInput, InputSurface, SegmentedControl } from '@/components/ui/FormPrimitives';
import { SearchIcon } from '@/components/ui/Icons/SearchIcon/SearchIcon';
import { colours, layout, spacing } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortMode = 'recent' | 'name' | 'pinned';

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromDashboard?: string }>();
  const { loans, togglePinned, refresh } = useSavedLoans();
  const openedFromDashboard = params.fromDashboard === '1';
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
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
      if (sortMode === 'name') {
        return a.nickname.localeCompare(b.nickname);
      }

      if (sortMode === 'pinned') {
        const pinnedDelta = Number(b.pinnedToDashboard) - Number(a.pinnedToDashboard);
        if (pinnedDelta !== 0) return pinnedDelta;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [loans, query, sortMode, t]);

  useFocusEffect(refresh);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
            <Button
              label={t('saved.createNewCalculation')}
              onPress={() => router.push({
                pathname: '/' as never,
                params: { calculator: '1' },
              })}
              variant="secondary"
              style={styles.headerButton}
            />
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
                <SegmentedControl
                  value={sortMode}
                  onChange={setSortMode}
                  textVariant="labelSm"
                  options={[
                    { label: t('saved.sortRecent'), value: 'recent' },
                    { label: t('saved.sortName'), value: 'name' },
                    { label: t('saved.sortPinned'), value: 'pinned' },
                  ]}
                />
              </View>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <LoanProfileCard
            loan={item}
            onPress={() => router.push(`/saved/${item.id}`)}
            onTogglePinned={() => togglePinned(item.id)}
          />
        )}
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
  headerButton: {
    alignSelf: 'flex-start',
  },
  controls: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchInput: {
    marginLeft: spacing.xs,
  },
});
