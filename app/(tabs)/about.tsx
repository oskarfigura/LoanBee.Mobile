import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const VARIABLE_KEYS = ['varA', 'varP', 'varR', 'varN'] as const;

interface FaqItem {
  q: string;
  a: string;
}

export default function AboutScreen() {
  const { t } = useTranslation();
  const faqItems = t('about.faqItems', { returnObjects: true }) as FaqItem[];
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScreenHeader title={t('tabs.about')} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('about.formula')}</Text>
          <Text style={styles.body}>{t('about.formulaDesc')}</Text>

          <View style={styles.formulaPanel}>
            <View style={styles.formulaRow}>
              <Text style={styles.formulaLead}>A = P ·</Text>
              <View style={styles.fraction}>
                <Text style={styles.fractionText}>r(1+r)^n</Text>
                <View style={styles.fractionLine} />
                <Text style={styles.fractionText}>(1+r)^n - 1</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subtitle}>{t('about.variables')}</Text>
          <View style={styles.variableGrid}>
            {VARIABLE_KEYS.map(key => {
              const [symbol, label] = t(`about.${key}`).split(' = ');
              return (
                <View key={key} style={styles.variableTile}>
                  <Text style={styles.variableSymbol}>{symbol}</Text>
                  <Text style={styles.variableLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>{t('about.disclaimer')}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>{t('about.faqTitle')}</Text>
          <View style={styles.faqList}>
            {faqItems.map((item, index) => {
              const expanded = openFaqIndex === index;
              return (
                <View key={item.q} style={[styles.faqItem, expanded && styles.faqItemOpen]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={styles.faqQuestionRow}
                    onPress={() => setOpenFaqIndex(expanded ? -1 : index)}
                  >
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Text style={styles.faqToggle}>{expanded ? '-' : '+'}</Text>
                  </TouchableOpacity>
                  {expanded && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </View>
              );
            })}
          </View>
        </Card>

        <Text style={styles.version}>LoanBee • Made with 🐝 by The Tech Narrative</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  container: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 16 },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colours.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  formulaPanel: {
    backgroundColor: colours.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colours.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  formulaLead: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
    marginRight: 10,
  },
  fraction: {
    minWidth: 150,
    alignItems: 'center',
  },
  fractionText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colours.primary,
    textAlign: 'center',
  },
  fractionLine: {
    height: 2,
    alignSelf: 'stretch',
    backgroundColor: colours.primary,
    marginVertical: 6,
  },
  subtitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
    marginBottom: 10,
  },
  variableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  variableTile: {
    width: '47%',
    backgroundColor: colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
    padding: 12,
  },
  variableSymbol: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colours.primary,
    marginBottom: 4,
  },
  variableLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
    lineHeight: 17,
  },
  disclaimerCard: {
    backgroundColor: colours.surface,
    borderLeftWidth: 3,
    borderLeftColor: colours.accent,
    marginBottom: 16,
  },
  disclaimerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    lineHeight: 20,
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
    overflow: 'hidden',
  },
  faqItemOpen: {
    borderColor: colours.accent,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colours.textPrimary,
    lineHeight: 19,
  },
  faqToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colours.primary,
    color: colours.white,
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    lineHeight: 23,
    textAlign: 'center',
  },
  faqAnswer: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
    lineHeight: 21,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  version: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
    textAlign: 'center',
    paddingTop: 8,
  },
});
