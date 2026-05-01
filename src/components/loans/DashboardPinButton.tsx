import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PinIcon } from '@/components/loans/LoanIcons';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';

interface Props {
  pinned: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const DashboardPinButton = ({ pinned, onPress, style }: Props) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.button, pinned ? styles.buttonPinned : styles.buttonUnpinned, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.iconWrap, pinned ? styles.iconWrapPinned : styles.iconWrapUnpinned]}>
        <PinIcon color={pinned ? colours.secondary : colours.primary} size={16} />
      </View>
      <Text style={[styles.title, pinned ? styles.titlePinned : styles.titleUnpinned]}>
        {pinned ? t('mortgage.pinnedToDashboard') : t('mortgage.pinToDashboard')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  buttonUnpinned: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
  },
  buttonPinned: {
    backgroundColor: colours.successSurface,
    borderColor: colours.successBorder,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconWrapUnpinned: {
    backgroundColor: colours.focusRing,
  },
  iconWrapPinned: {
    backgroundColor: colours.successLight,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  titleUnpinned: {
    color: colours.primary,
  },
  titlePinned: {
    color: colours.secondary,
  },
});
