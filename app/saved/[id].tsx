import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { savedLoansStorage } from '@/storage/savedLoans';
import { LoanCalculationView } from '@/components/calculator/LoanCalculationView';
import { LoanSummaryOverview } from '@/components/calculator/LoanSummaryOverview';
import { Button } from '@/components/ui/Button';
import { colours, fonts, fontSizes, layout, spacing } from '@/theme';
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

  const hasSavings = (loan.formSnapshot.additionalMonthlyPayment ?? 0) > 0;
  const savings = loan.resultSnapshot.totalInterestPaidBaseline - loan.resultSnapshot.totalInterestPaid;
  const manageButton = (
    <Button
      label={t('edit.manageShort')}
      onPress={() => router.push(`/saved/${id}/edit`)}
      variant="secondary"
      style={styles.secondaryAction}
    />
  );

  if (loan.category === 'mortgage') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('saved.loanDetail')}
          leftAction={<HeaderBackAction onPress={handleBack} />}
        />
        <ScrollView contentContainerStyle={styles.container}>
          <LoanCalculationView
            result={result}
            startDate={loan.formSnapshot.startDate}
            currency={loan.currency}
            summaryContent={(
              <>
                <MortgageGroupDetail
                  loan={loan}
                  onTogglePinned={() => {
                    savedLoansStorage.togglePinned(loan.id);
                    refresh();
                  }}
                />
                {manageButton}
              </>
            )}
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
        <LoanCalculationView
          result={result}
          startDate={loan.formSnapshot.startDate}
          currency={loan.currency}
          summaryContent={(
            <>
              <LoanSummaryOverview
                result={result}
                startDate={loan.formSnapshot.startDate}
                currency={loan.currency}
                title={loan.nickname}
                subtitle={loan.lender || t('saved.category.loan')}
                headerAction={(
                  <DashboardPinButton
                    pinned={loan.pinnedToDashboard}
                    onPress={() => {
                      savedLoansStorage.togglePinned(loan.id);
                      refresh();
                    }}
                    style={styles.pinButton}
                  />
                )}
                showSavings={hasSavings}
                savingsAmount={savings}
              />
              {manageButton}
            </>
          )}
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
  pinButton: {
    marginBottom: 0,
    marginTop: 4,
  },
  secondaryAction: {
    marginTop: 8,
  },
});
