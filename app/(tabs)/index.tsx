import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  getDefaultCurrency,
  useLoanCalculatorForm,
  LoanCalculatorFormValues,
} from '@/hooks/useLoanCalculatorForm';
import { getLoanCalculations } from '@/core/amortisation';
import { LoanCalculationType } from '@/core/LoanCalculationType';
import { DownPaymentType } from '@/core/DownPaymentType';
import { LoanForm } from '@/components/calculator/LoanForm';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colours } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalculatorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useLoanCalculatorForm();

  useFocusEffect(
    useCallback(() => {
      form.setValue('currency', getDefaultCurrency(), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }, [form])
  );

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
      pathname: '/calculator/result',
      params: {
        result: JSON.stringify(result),
        formValues: JSON.stringify(values),
        currency: values.currency,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={t('calculator.title')} subtitle={t('calculator.subtitle')} />
      <LoanForm form={form} onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
});
