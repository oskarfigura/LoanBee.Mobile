import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getLoanCalculations } from '@/core/amortisation';
import { DownPaymentType } from '@/core/DownPaymentType';
import { LoanCalculationType } from '@/core/LoanCalculationType';
import { CURRENCIES, CurrencyCode } from '@/currency/currencies';
import { formatCurrency } from '@/currency/format';
import { CurrencyPicker } from '@/components/calculator/CurrencyPicker';
import { LenderTextInput } from '@/components/loans/LenderTextInput';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { KeyboardAwareFormScreen } from '@/components/ui/KeyboardAwareFormScreen';
import {
  AppTextInput,
  FieldError,
  FieldHint,
  FieldLabel,
  FormSection,
  InputAffix,
  InputSurface,
} from '@/components/ui/FormPrimitives';
import { buildInitialDeal, buildResultSnapshot, normaliseFormSnapshot } from '@/loans/loanGroupFactory';
import { savedLoansStorage } from '@/storage/savedLoans';
import { storage } from '@/storage/mmkv';
import { STORAGE_KEYS } from '@/storage/keys';
import { SavedLoan } from '@/types/SavedLoan';
import { createLocalId } from '@/utils/id';
import { formatIsoDate } from '@/utils/date';
import { validateDurationText, validateMoneyText } from '@/utils/formValidation';
import { SaveIcon } from '@/components/ui/Icons/SaveIcon/SaveIcon';
import { colours, spacing } from '@/theme';

const numberText = (value = '') => value;

export default function MortgageHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const defaultCurrency = (storage.getString(STORAGE_KEYS.USER_CURRENCY) as CurrencyCode | undefined) ?? 'GBP';
  const currencySymbol = CURRENCIES.find(c => c.code === defaultCurrency)?.symbol ?? '£';

  const [nickname, setNickname] = useState('');
  const [lender, setLender] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [startDate, setStartDate] = useState(formatIsoDate(new Date()));
  const [originalBalance, setOriginalBalance] = useState(numberText());
  const [interestRate, setInterestRate] = useState(numberText());
  const [termYears, setTermYears] = useState('25');
  const [termMonths, setTermMonths] = useState('0');
  const [dealYears, setDealYears] = useState('2');
  const [dealMonths, setDealMonths] = useState('0');

  const activeCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? currencySymbol;
  const balanceValidation = validateMoneyText(originalBalance);
  const rateValidation = validateMoneyText(interestRate, { max: 100, maxErrorKey: 'forms.interestMax' });
  const termValidation = validateDurationText(termYears, termMonths);
  const dealValidation = validateDurationText(dealYears, dealMonths);
  const dealLongerThanMortgage = dealValidation.isValid
    && termValidation.isValid
    && dealValidation.totalMonths > termValidation.totalMonths;
  const canSave = nickname.trim().length > 0
    && balanceValidation.isValid
    && rateValidation.isValid
    && termValidation.isValid
    && dealValidation.isValid
    && !dealLongerThanMortgage;

  const monthlyPreview = useMemo(() => {
    if (!balanceValidation.isValid || !rateValidation.isValid || !termValidation.isValid) return null;
    return getLoanCalculations(
      balanceValidation.numeric,
      rateValidation.numeric,
      Math.floor(termValidation.totalMonths / 12),
      termValidation.totalMonths % 12,
      0,
      LoanCalculationType.TERM,
      0,
      DownPaymentType.CASH,
      0,
      startDate,
    ).monthlyPayments;
  }, [balanceValidation, rateValidation, startDate, termValidation]);

  const handleSave = () => {
    if (!canSave) return;

    const now = new Date().toISOString();
    const formValues = {
      loanAmount: balanceValidation.numeric,
      interest: rateValidation.numeric,
      termInYears: Math.floor(termValidation.totalMonths / 12),
      termInMonths: termValidation.totalMonths % 12,
      downPayment: 0,
      downPaymentType: DownPaymentType.CASH,
      desiredMonthlyPayment: 0,
      additionalMonthlyPayment: 0,
      startDate,
      calculationType: LoanCalculationType.TERM,
      currency,
    };
    const result = getLoanCalculations(
      formValues.loanAmount,
      formValues.interest,
      formValues.termInYears,
      formValues.termInMonths,
      0,
      LoanCalculationType.TERM,
      0,
      DownPaymentType.CASH,
      0,
      startDate,
    );
    const formSnapshot = normaliseFormSnapshot(formValues, currency);
    const resultSnapshot = buildResultSnapshot(result, result.totalInterestPaid);
    const baseLoan = {
      category: 'mortgage' as const,
      lender: lender.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      mortgageTermInMonths: termValidation.totalMonths,
      formSnapshot,
      resultSnapshot,
    };
    const initialDeal = buildInitialDeal(createLocalId('deal'), baseLoan, {
      durationInMonths: dealValidation.totalMonths,
      source: 'userDeal',
    });
    const loan: SavedLoan = {
      id: createLocalId(),
      createdAt: now,
      updatedAt: now,
      nickname: nickname.trim(),
      lender: lender.trim() || undefined,
      category: 'mortgage',
      currency,
      mortgageTermInMonths: termValidation.totalMonths,
      status: 'tracked',
      pinnedToDashboard: true,
      dashboardOrder: savedLoansStorage.getMaxDashboardOrder() + 1,
      deals: [initialDeal],
      events: [],
      formSnapshot,
      resultSnapshot,
    };

    savedLoansStorage.add(loan);
    router.replace({
      pathname: '/saved/[id]' as never,
      params: { id: loan.id, fromSave: '1' },
    });
  };

  return (
    <KeyboardAwareFormScreen
      title={t('history.title')}
      subtitle={t('history.subtitle')}
      onClose={() => router.back()}
      footer={(
        <Button
          label={t('history.save')}
          onPress={handleSave}
          disabled={!canSave}
          leftIcon={<SaveIcon color={colours.white} size={18} />}
        />
      )}
    >
      <FormSection title={t('history.sectionMortgage')} accent>
        <AppText variant="bodySm" tone="muted" style={styles.sectionIntro}>
          {t('history.mortgageHelp')}
        </AppText>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('track.nickname')}</FieldLabel>
          <InputSurface>
            <AppTextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('track.nicknamePlaceholder')}
            />
          </InputSurface>
        </View>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('track.lender')}</FieldLabel>
          <LenderTextInput value={lender} onChange={setLender} />
        </View>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('track.currency')}</FieldLabel>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </View>
        <DatePickerField
          label={t('calculator.startDate')}
          value={startDate}
          onChange={setStartDate}
          hint={t('mortgage.dateFormatHint')}
        />
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('history.originalBalance')}</FieldLabel>
          <InputSurface error={!balanceValidation.isValid && !balanceValidation.isEmpty}>
            <InputAffix>{activeCurrencySymbol}</InputAffix>
            <AppTextInput value={originalBalance} onChangeText={setOriginalBalance} keyboardType="decimal-pad" placeholder="250000" />
          </InputSurface>
          <FieldError message={!balanceValidation.isEmpty && balanceValidation.errorKey ? t(balanceValidation.errorKey) : undefined} />
        </View>
      </FormSection>

      <FormSection title={t('history.sectionFirstDeal')}>
        <AppText variant="bodySm" tone="muted" style={styles.sectionIntro}>
          {t('history.firstDealHelp')}
        </AppText>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('calculator.interestRate')}</FieldLabel>
          <InputSurface error={!rateValidation.isValid && !rateValidation.isEmpty}>
            <AppTextInput value={interestRate} onChangeText={setInterestRate} keyboardType="decimal-pad" placeholder="2.29" />
            <InputAffix trailing>%</InputAffix>
          </InputSurface>
          <FieldError message={!rateValidation.isEmpty && rateValidation.errorKey ? t(rateValidation.errorKey) : undefined} />
        </View>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('mortgage.totalMortgageTerm')}</FieldLabel>
          <View style={styles.row}>
            <InputSurface style={styles.half}>
              <AppTextInput value={termYears} onChangeText={setTermYears} keyboardType="number-pad" />
              <InputAffix trailing>{t('mortgage.totalMortgageTermYears')}</InputAffix>
            </InputSurface>
            <InputSurface style={styles.half}>
              <AppTextInput value={termMonths} onChangeText={setTermMonths} keyboardType="number-pad" />
              <InputAffix trailing>{t('mortgage.totalMortgageTermMonths')}</InputAffix>
            </InputSurface>
          </View>
          <FieldError message={termValidation.errorKey ? t(termValidation.errorKey) : undefined} />
        </View>
        <View style={styles.fieldGroup}>
          <FieldLabel>{t('history.firstDealDuration')}</FieldLabel>
          <View style={styles.row}>
            <InputSurface style={styles.half}>
              <AppTextInput value={dealYears} onChangeText={setDealYears} keyboardType="number-pad" />
              <InputAffix trailing>{t('mortgage.totalMortgageTermYears')}</InputAffix>
            </InputSurface>
            <InputSurface style={styles.half}>
              <AppTextInput value={dealMonths} onChangeText={setDealMonths} keyboardType="number-pad" />
              <InputAffix trailing>{t('mortgage.totalMortgageTermMonths')}</InputAffix>
            </InputSurface>
          </View>
          <FieldError
            message={
              dealLongerThanMortgage
                ? t('history.dealLongerThanMortgage')
                : dealValidation.errorKey
                  ? t(dealValidation.errorKey)
                  : undefined
            }
          />
          <FieldHint>{t('history.firstDealDurationHint')}</FieldHint>
        </View>
      </FormSection>

      {monthlyPreview ? (
        <View style={styles.preview}>
          <AppText variant="labelSm" tone="muted" style={styles.previewLabel}>
            {t('results.monthlyPayment')}
          </AppText>
          <AppText variant="title2" tone="accent">
            {formatCurrency(monthlyPreview, currency)}
          </AppText>
        </View>
      ) : null}
    </KeyboardAwareFormScreen>
  );
}

const styles = StyleSheet.create({
  sectionIntro: { marginBottom: spacing.xs },
  fieldGroup: { gap: spacing.xxs },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: { flex: 1 },
  preview: {
    borderWidth: 1,
    borderColor: colours.borderSoft,
    backgroundColor: colours.surfaceRaised,
    borderRadius: 16,
    padding: spacing.md,
  },
  previewLabel: {
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
});
