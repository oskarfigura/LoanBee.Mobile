import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra as {
  admobBannerAndroid?: string | null;
  admobBannerIos?: string | null;
} | undefined;

const prodBannerId =
  Platform.OS === 'android'
    ? (extra?.admobBannerAndroid ?? null)
    : (extra?.admobBannerIos ?? null);

// Falls back to Google test ID in dev or when production IDs aren't set via env vars
export const AD_UNITS = {
  banner: __DEV__ || !prodBannerId ? TestIds.ADAPTIVE_BANNER : prodBannerId,
};
