import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { OverpaymentsView } from '@/components/loans/OverpaymentsView';
import { createLoanOverpaymentScope } from '@/loans/overpaymentScope';
import { SavedLoan } from '@/types/SavedLoan';

export default function OverpaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const createScope = useCallback((loan: SavedLoan) => createLoanOverpaymentScope(loan), []);

  return (
    <OverpaymentsView id={id} notFoundTitleKey="overpayments.title" createScope={createScope} />
  );
}
