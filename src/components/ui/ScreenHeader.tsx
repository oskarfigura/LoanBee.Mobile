import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';

const logo = require('../../../assets/bee-logo.png');

interface Props {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const ScreenHeader = ({ title, subtitle, leftAction, rightAction }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {leftAction ? (
        <View style={styles.actionWrap}>{leftAction}</View>
      ) : (
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colours.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colours.primaryDark,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colours.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colours.accent,
    overflow: 'hidden',
  },
  logo: {
    width: 38,
    height: 38,
  },
  actionWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  copy: {
    flex: 1,
  },
  rightAction: {
    marginLeft: 12,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colours.white,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.whiteSubtle,
    lineHeight: 19,
    marginTop: 2,
  },
});
