import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MortgageEventForm, mortgageEventLabelKey } from '@/components/loans/MortgageEventForm';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { HeaderBackAction } from '@/components/ui/HeaderBackAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { removeMortgageEvent, upsertMortgageEvent } from '@/mortgage/events';
import { savedLoansStorage } from '@/storage/savedLoans';
import { colours, layout, spacing } from '@/theme';

export default function EditMortgageEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const loan = savedLoansStorage.getById(id);
  const event = loan?.events.find(item => item.id === eventId);
  const deal = event ? loan?.deals.find(item => item.id === event.dealId) : undefined;

  if (!loan || !event || !deal) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScreenHeader
          title={t('mortgage.editEvent')}
          leftAction={<HeaderBackAction onPress={() => router.back()} />}
        />
        <View style={styles.notFound}>
          <AppText variant="title3" style={styles.notFoundText}>{t('saved.notFound')}</AppText>
          <Button label={t('common.goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('mortgage.deleteEvent'),
      t('mortgage.deleteEventMessage'),
      [
        { text: t('results.cancelLeave'), style: 'cancel' },
        {
          text: t('mortgage.deleteEvent'),
          style: 'destructive',
          onPress: () => {
            savedLoansStorage.update(removeMortgageEvent(loan, event.id));
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader
        title={t('mortgage.editEvent')}
        subtitle={t(mortgageEventLabelKey(event.type))}
        leftAction={<HeaderBackAction onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <MortgageEventForm
          currency={loan.currency}
          currentDeal={deal}
          events={loan.events}
          initialEvent={event}
          onSave={updatedEvent => {
            savedLoansStorage.update(upsertMortgageEvent(loan, updatedEvent));
            router.back();
          }}
          onDelete={handleDelete}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: layout.screenPadding, paddingBottom: spacing['3xl'] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  notFoundText: { marginBottom: spacing.md },
});
