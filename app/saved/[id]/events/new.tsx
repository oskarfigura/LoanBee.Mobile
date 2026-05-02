import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { AppTextInput, FieldLabel, InputAffix, InputSurface, PillSelector } from '@/components/ui/FormPrimitives';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CURRENCIES } from '@/currency/currencies';
import { getCurrentDeal, projectDeal } from '@/mortgage/tracker';
import { savedLoansStorage } from '@/storage/savedLoans';
import { MortgageEventType } from '@/types/SavedLoan';
import { createLocalId } from '@/utils/id';
import { colours, layout, spacing } from '@/theme';

const eventTypes: MortgageEventType[] = [
  'lumpOverpayment',
  'missedPayment',
  'paymentHoliday',
  'balanceCheckpoint',
  'note',
];

const eventLabel = (type: MortgageEventType) => {
  if (type === 'lumpOverpayment') return 'Lump overpayment';
  if (type === 'missedPayment') return 'Missed payment';
  if (type === 'paymentHoliday') return 'Payment holiday';
  if (type === 'balanceCheckpoint') return 'Bank balance';
  return 'Note';
};

export default function NewMortgageEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: MortgageEventType }>();
  const loan = savedLoansStorage.getById(id);
  const currentDeal = loan ? getCurrentDeal(loan) : undefined;
  const projected = currentDeal && loan ? projectDeal(currentDeal, loan.events) : null;
  const currencySymbol = CURRENCIES.find(c => c.code === loan?.currency)?.symbol ?? '£';

  const [eventType, setEventType] = useState<MortgageEventType>(
    type && eventTypes.includes(type) ? type : 'lumpOverpayment',
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(projected ? String(projected.balance) : '');
  const [note, setNote] = useState('');

  if (!loan || !currentDeal) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('mortgage.addEvent')}
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <View style={styles.notFound}>
          <AppText variant="title3" style={styles.notFoundText}>{t('mortgage.noCurrentDeal')}</AppText>
          <Button label={t('common.goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const needsAmount = eventType === 'lumpOverpayment';
  const needsBalance = eventType === 'balanceCheckpoint';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={t('mortgage.addEvent')}
        subtitle={t('mortgage.eventHelp')}
        leftAction={<HeaderBackAction onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.field}>
          <FieldLabel>{t('mortgage.eventType')}</FieldLabel>
          <PillSelector
            value={eventType}
            onChange={setEventType}
            options={eventTypes.map(item => ({ value: item, label: eventLabel(item) }))}
            wrap
          />
        </View>

        <View style={styles.field}>
          <FieldLabel>{t('mortgage.eventDate')}</FieldLabel>
          <InputSurface>
            <AppTextInput
              value={date}
              onChangeText={setDate}
              placeholder="2026-06-01"
            />
          </InputSurface>
        </View>

        {needsAmount && (
          <View style={styles.field}>
            <FieldLabel>{t('mortgage.amount')}</FieldLabel>
            <InputSurface>
              <InputAffix>{currencySymbol}</InputAffix>
              <AppTextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="5000"
              />
            </InputSurface>
          </View>
        )}

        {needsBalance && (
          <View style={styles.field}>
            <FieldLabel>{t('mortgage.bankConfirmedBalance')}</FieldLabel>
            <InputSurface>
              <InputAffix>{currencySymbol}</InputAffix>
              <AppTextInput
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
                placeholder="238420"
              />
            </InputSurface>
          </View>
        )}

        <View style={styles.field}>
          <FieldLabel>{t('mortgage.notes')}</FieldLabel>
          <InputSurface multiline>
            <AppTextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={t('mortgage.notesPlaceholder')}
              multiline
            />
          </InputSurface>
        </View>

        <Button
          label={t('mortgage.saveEvent')}
          onPress={() => {
            const numericAmount = Number(amount) || 0;
            const numericBalance = Number(balance) || 0;
            if (needsAmount && numericAmount <= 0) {
              Alert.alert(t('mortgage.invalidEventTitle'), t('mortgage.invalidEventAmount'));
              return;
            }
            if (needsAmount && projected && numericAmount > projected.balance) {
              Alert.alert(t('mortgage.invalidEventTitle'), t('mortgage.overpaymentTooLarge'));
              return;
            }
            if (needsBalance && numericBalance <= 0) {
              Alert.alert(t('mortgage.invalidEventTitle'), t('mortgage.invalidEventBalance'));
              return;
            }

            const now = new Date().toISOString();
            savedLoansStorage.update({
              ...loan,
              events: [
                ...loan.events,
                {
                  id: createLocalId(),
                  createdAt: now,
                  updatedAt: now,
                  dealId: currentDeal.id,
                  type: eventType,
                  date,
                  amount: needsAmount ? numericAmount : undefined,
                  balance: needsBalance ? numericBalance : undefined,
                  note: note.trim() || undefined,
                },
              ],
            });
            router.back();
          }}
          style={styles.action}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: layout.screenPadding, paddingBottom: spacing['3xl'] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFoundText: { marginBottom: spacing.md },
  field: { marginTop: spacing.md },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  action: { marginTop: spacing.xl },
});
