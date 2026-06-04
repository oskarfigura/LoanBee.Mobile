import { Alert, Share } from 'react-native';
import { buildCalculationSharePayload, CalculationShareInput } from '@/share/calculationShareMessage';

export const shareCalculation = async (input: CalculationShareInput): Promise<void> => {
  try {
    await Share.share(buildCalculationSharePayload(input));
  } catch {
    Alert.alert(input.t('share.errorTitle'), input.t('share.errorMessage'));
  }
};
