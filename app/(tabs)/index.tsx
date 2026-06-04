import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  getDefaultCurrency,
  useLoanCalculatorForm,
  LoanCalculatorFormValues,
} from '@/hooks/useLoanCalculatorForm';
import { useSavedLoans } from '@/hooks/useSavedLoans';
import { getLoanCalculations } from '@/core/amortisation';
import { LoanCalculationType } from '@/core/LoanCalculationType';
import { DownPaymentType } from '@/core/DownPaymentType';
import { CurrencyCode } from '@/currency/currencies';
import { LoanForm } from '@/components/calculator/LoanForm';
import { MortgageDashboard } from '@/components/loans/MortgageDashboard';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { colours, elevation, layout, radii, spacing } from '@/theme';
import { buildDraftResultParams } from '@/results/loanResultRoute';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hasSeenGuide } from '@/onboarding/guideState';
import { whenConsentFlowComplete } from '@/onboarding/firstRunGate';
import type { LoanCategory } from '@/types/SavedLoan';

type JourneyMode = 'scenario' | 'track';
type JourneyStep = 'borrowingType' | 'intent' | 'mortgageTrack' | 'form';

interface JourneyOptionProps {
  title: string;
  body: string;
  meta?: string;
  onPress: () => void;
}

const JourneyOption = ({ title, body, meta, onPress }: JourneyOptionProps) => (
  <TouchableOpacity
    accessibilityRole="button"
    activeOpacity={0.84}
    onPress={onPress}
    style={styles.optionCard}
  >
    {meta ? (
      <AppText variant="labelSm" tone="accent" style={styles.optionMeta}>
        {meta}
      </AppText>
    ) : null}
    <AppText variant="title2" style={styles.optionTitle}>
      {title}
    </AppText>
    <AppText variant="bodySm" tone="muted" style={styles.optionBody}>
      {body}
    </AppText>
  </TouchableOpacity>
);

export default function CalculatorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ calculator?: string; dashboard?: string }>();
  const form = useLoanCalculatorForm();
  const { loans, refresh } = useSavedLoans();
  const [category, setCategory] = useState<LoanCategory>('mortgage');
  const [journeyMode, setJourneyMode] = useState<JourneyMode>('scenario');
  const [journeyStep, setJourneyStep] = useState<JourneyStep>('borrowingType');
  const [showCalculator, setShowCalculator] = useState(false);
  const firstRunChecked = useRef(false);

  const pinnedLoans = useMemo(
    () => loans
      .filter(loan => loan.pinnedToDashboard)
      .sort((a, b) => (a.dashboardOrder ?? 0) - (b.dashboardOrder ?? 0)),
    [loans],
  );

  useEffect(() => {
    if (firstRunChecked.current) return;
    firstRunChecked.current = true;
    if (hasSeenGuide()) return;

    let cancelled = false;

    whenConsentFlowComplete().then(() => {
      if (!cancelled && !hasSeenGuide()) {
        router.push('/guide?firstRun=1');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (params.calculator === '1') {
      setShowCalculator(true);
      setCategory('mortgage');
      setJourneyMode('scenario');
      setJourneyStep('borrowingType');
    }
  }, [params.calculator]);

  useEffect(() => {
    if (params.dashboard) {
      setShowCalculator(false);
    }
  }, [params.dashboard]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      form.setValue('currency', getDefaultCurrency(), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }, [form, refresh])
  );

  const openCalculator = useCallback(() => {
    setShowCalculator(true);
    setCategory('mortgage');
    setJourneyMode('scenario');
    setJourneyStep('borrowingType');
  }, []);

  const returnToDashboard = useCallback(() => {
    setShowCalculator(false);
  }, []);

  const handleJourneyBack = useCallback(() => {
    if (journeyStep === 'borrowingType') {
      returnToDashboard();
      return;
    }

    if (journeyStep === 'intent') {
      setJourneyStep('borrowingType');
      return;
    }

    setJourneyStep('intent');
  }, [journeyStep, returnToDashboard]);

  const selectCategory = useCallback((nextCategory: LoanCategory) => {
    setCategory(nextCategory);
    setJourneyMode('scenario');
    setJourneyStep('intent');
  }, []);

  const selectJourneyMode = useCallback((nextMode: JourneyMode) => {
    setJourneyMode(nextMode);
    if (nextMode === 'track' && category === 'mortgage') {
      setJourneyStep('mortgageTrack');
      return;
    }

    setJourneyStep('form');
  }, [category]);

  const handleSubmit = (values: LoanCalculatorFormValues) => {
    const result = getLoanCalculations(
      values.loanAmount,
      values.interest,
      values.termInYears ?? 0,
      values.termInMonths ?? 0,
      values.desiredMonthlyPayment ?? 0,
      values.calculationType as LoanCalculationType,
      values.downPayment,
      values.downPaymentType as DownPaymentType,
      values.additionalMonthlyPayment,
      values.startDate,
    );

    router.push({
      pathname: '/result' as never,
      params: buildDraftResultParams(result, values, values.currency as CurrencyCode, category),
    });
  };

  const canGoBackInJourney = pinnedLoans.length > 0 || journeyStep !== 'borrowingType';
  const journeyBackAction = canGoBackInJourney ? (
    <HeaderBackAction onPress={handleJourneyBack} />
  ) : undefined;

  if (pinnedLoans.length > 0 && !showCalculator) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <MortgageDashboard loans={pinnedLoans} onNewCalculation={openCalculator} />
      </SafeAreaView>
    );
  }

  if (journeyStep !== 'form') {
    const isBorrowingStep = journeyStep === 'borrowingType';
    const isTrackMortgageStep = journeyStep === 'mortgageTrack';
    const headerTitle = isTrackMortgageStep ? t('journey.trackMortgageTitle') : t('journey.title');
    const stepLabel = isBorrowingStep
      ? t('journey.stepBorrowing')
      : isTrackMortgageStep
        ? t('journey.stepTrackMortgage')
        : t('journey.stepIntent');
    const screenTitle = isBorrowingStep
      ? t('journey.borrowingTypeTitle')
      : isTrackMortgageStep
        ? t('journey.trackMortgageTitle')
        : t('journey.intentTitle', {
          category: category === 'mortgage'
            ? t('journey.mortgageOptionTitle')
            : t('journey.loanOptionTitle'),
        });
    const screenBody = isBorrowingStep
      ? t('journey.borrowingTypeHelp')
      : isTrackMortgageStep
        ? t('journey.trackMortgageHelp')
        : t('journey.intentHelp');

    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScreenHeader
          title={headerTitle}
          variant="top-level"
          leftAction={journeyBackAction}
        />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.journeyIntro}>
            <AppText variant="labelSm" tone="accent" style={styles.kicker}>
              {stepLabel}
            </AppText>
            <AppText variant="title1" style={styles.journeyTitle}>
              {screenTitle}
            </AppText>
            <AppText variant="bodyLg" tone="muted" style={styles.journeyBody}>
              {screenBody}
            </AppText>
          </View>

          <View style={styles.optionList}>
            {isBorrowingStep ? (
              <>
                <JourneyOption
                  title={t('journey.mortgageOptionTitle')}
                  body={t('journey.mortgageOptionBody')}
                  onPress={() => selectCategory('mortgage')}
                />
                <JourneyOption
                  title={t('journey.loanOptionTitle')}
                  body={t('journey.loanOptionBody')}
                  onPress={() => selectCategory('loan')}
                />
              </>
            ) : isTrackMortgageStep ? (
              <>
                <JourneyOption
                  title={t('journey.trackFromToday')}
                  body={t('journey.trackFromTodayHelp')}
                  meta={t('journey.simpleSetup')}
                  onPress={() => router.push('/saved/track')}
                />
                <JourneyOption
                  title={t('journey.buildHistory')}
                  body={t('journey.buildHistoryHelp')}
                  meta={t('journey.advancedSetup')}
                  onPress={() => router.push('/saved/history')}
                />
              </>
            ) : (
              <>
                <JourneyOption
                  title={t('journey.exploreScenario')}
                  body={t('journey.scenarioHelp')}
                  onPress={() => selectJourneyMode('scenario')}
                />
                <JourneyOption
                  title={t('journey.trackBorrowing')}
                  body={t('journey.trackHelp')}
                  onPress={() => selectJourneyMode('track')}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    // No 'bottom' edge: this screen sits above the tab bar, which owns the bottom inset.
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScreenHeader
        title={t('tabs.calculator')}
        variant="top-level"
        leftAction={journeyBackAction}
      />
      <LoanForm
        form={form}
        onSubmit={handleSubmit}
        category={category}
        submitLabel={journeyMode === 'track' ? t('journey.calculateToTrack') : undefined}
        topContent={(
          <View style={styles.pageIntro}>
            <AppText variant="bodyLg" tone="muted" style={styles.pageSubtitle}>
              {category === 'mortgage' ? t('calculator.subtitleMortgage') : t('calculator.subtitleLoan')}
            </AppText>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: {
    padding: layout.screenPadding,
    paddingBottom: spacing['3xl'],
  },
  kicker: {
    textTransform: 'uppercase',
  },
  journeyIntro: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  journeyTitle: {
    color: colours.textPrimary,
  },
  journeyBody: {
    maxWidth: '96%',
  },
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colours.surfaceRaised,
    borderColor: colours.borderSoft,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: layout.cardPadding,
    gap: spacing.xs,
    ...elevation.level1,
  },
  optionMeta: {
    textTransform: 'uppercase',
  },
  optionTitle: {
    color: colours.textPrimary,
  },
  optionBody: {
    maxWidth: '96%',
  },
  pageIntro: {
    marginBottom: spacing.lg,
  },
  pageSubtitle: {
    maxWidth: '96%',
  },
});
