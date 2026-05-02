import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colours, fontSizes, fontWeights, layout, spacing } from '@/theme';

const logo = require('../../../assets/bee-logo.png');

interface Props {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  variant?: 'top-level' | 'detail' | 'editor';
  showBrand?: boolean;
}

export const ScreenHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  variant = 'top-level',
  showBrand = false,
}: Props) => {
  const insets = useSafeAreaInsets();
  const compact = variant !== 'top-level';

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brandRow}>
        <View style={styles.leading}>
          {leftAction ? <View style={styles.actionWrap}>{leftAction}</View> : null}
          {showBrand ? (
            <View style={styles.brandCopy}>
              <View style={styles.wordmarkRow}>
                <AppText variant="display" style={styles.wordmark} numberOfLines={1}>
                  LoanBee
                </AppText>
                <Image source={logo} style={styles.inlineBee} resizeMode="contain" />
              </View>
              <AppText variant="bodyLg" tone="muted" style={styles.brandSubtitle} numberOfLines={2}>
                {title}
              </AppText>
            </View>
          ) : (
            <View style={[styles.brandCopy, styles.brandCopyCompact]}>
              <AppText variant={compact ? 'title2' : 'title1'} style={styles.plainTitle} numberOfLines={2}>
                {title}
              </AppText>
            </View>
          )}
        </View>
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>
      {subtitle ? (
        <AppText variant="bodyMd" tone="muted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colours.background,
    paddingHorizontal: layout.headerPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colours.borderSoft,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flex: 1,
  },
  brandCopy: {
    flex: 1,
  },
  brandCopyCompact: {
    flex: 1,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  wordmark: {
    color: colours.primaryInk,
    fontSize: fontSizes['3xl'],
    lineHeight: 40,
    fontWeight: fontWeights.extrabold,
  },
  inlineBee: {
    width: 30,
    height: 30,
    marginLeft: -2,
  },
  brandSubtitle: {
    marginTop: spacing.xxs,
    maxWidth: '92%',
  },
  plainTitle: {
    color: colours.textPrimary,
  },
  actionWrap: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rightAction: {
    marginLeft: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: '92%',
  },
});
