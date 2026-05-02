import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import Svg, { Path } from 'react-native-svg';
import { colours, radii, spacing } from '@/theme';

interface Props {
  onPress: () => void;
  variant?: 'default' | 'circle';
}

export const HeaderBackAction = ({ onPress, variant = 'default' }: Props) => {
  if (variant === 'circle') {
    return (
      <TouchableOpacity
        style={styles.circleButton}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={colours.primary}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    );
  }

  return (
    <HeaderBackButton
      onPress={onPress}
      tintColor={colours.primary}
      displayMode="minimal"
    />
  );
};

const styles = StyleSheet.create({
  circleButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colours.surfaceRaised,
    borderWidth: 1,
    borderColor: colours.border,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginLeft: -spacing.xs,
  },
});
