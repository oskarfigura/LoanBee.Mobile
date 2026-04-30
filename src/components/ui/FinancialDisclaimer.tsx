import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';

export const FinancialDisclaimer = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(value => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.text}>
          <Text style={styles.label}>{t('disclaimer.label')} </Text>
          {t('disclaimer.shortText')} <Text style={styles.link}>{expanded ? t('disclaimer.less') : t('disclaimer.more')}</Text>
        </Text>
      </TouchableOpacity>
      {expanded && (
        <Text style={styles.fullText}>{t('disclaimer.fullText')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.heading,
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: fonts.heading,
    fontWeight: fontWeights.bold,
    color: colours.primary,
    textDecorationLine: 'underline',
  },
  fullText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
});
