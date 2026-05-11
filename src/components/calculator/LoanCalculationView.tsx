import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { CumulativeAreaChart } from '@/components/charts/CumulativeAreaChart';
import { LoanBreakdownDonut } from '@/components/charts/LoanBreakdownDonut';
import { RepaymentBarChart } from '@/components/charts/RepaymentBarChart';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { FinancialDisclaimer } from '@/components/ui/FinancialDisclaimer';
import { SegmentedControl } from '@/components/ui/FormPrimitives';
import { CurrencyCode } from '@/currency/currencies';
import { LoanResult } from '@/results/loanResultRoute';
import { colours, layout, radii, spacing } from '@/theme';
import { SavedLoan } from '@/types/SavedLoan';
import { AmortisationTable } from './AmortisationTable';
import { buildAmortisationCsv } from './amortisationTableUtils';
import { LoanSummaryOverview } from './LoanSummaryOverview';

type CalculationTab = 'summary' | 'charts' | 'schedule';

interface Props {
  result: LoanResult;
  startDate: string;
  currency: CurrencyCode;
  style?: StyleProp<ViewStyle>;
  onShare?: () => void;
  shareLabel?: string;
  shareIcon?: React.ReactNode;
  savedLoan?: SavedLoan;
  summaryContent?: React.ReactNode;
  tabStyle?: 'segmented' | 'underline';
  showFinancialDisclaimer?: boolean;
  ownsScroll?: boolean;
  scrollContentStyle?: StyleProp<ViewStyle>;
}

export const LoanCalculationView = ({
  result,
  startDate,
  currency,
  style,
  onShare,
  shareLabel,
  shareIcon,
  savedLoan,
  summaryContent,
  tabStyle = 'segmented',
  showFinancialDisclaimer = false,
  ownsScroll = false,
  scrollContentStyle,
}: Props) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<CalculationTab>('summary');
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const principalAmount = result.amount - result.downPayment;
  const tabs: Array<{ value: CalculationTab; label: string }> = [
    { value: 'summary', label: t('results.summary') },
    { value: 'charts', label: t('results.charts') },
    { value: 'schedule', label: t('results.schedule') },
  ];

  const handleExportCsv = useCallback(async () => {
    if (isExportingCsv) return;

    setIsExportingCsv(true);

    try {
      const csvContent = buildAmortisationCsv({
        items: result.tableItems,
        startDate,
        language: i18n.language,
        headers: {
          period: t('results.period'),
          openingBalance: t('results.openingBalance'),
          principal: t('results.principal'),
          interest: t('results.interest'),
          closingBalance: t('results.closingBalance'),
        },
      });

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        await Share.share({
          title: t('results.exportCsv'),
          message: csvContent,
        });
        return;
      }

      const fileName = `loanbee-amortisation-${new Date().toISOString().slice(0, 10)}.csv`;
      const file = new File(Paths.cache, fileName);

      file.create({ intermediates: true, overwrite: true });
      file.write(csvContent);

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
        dialogTitle: t('results.exportCsv'),
      });
    } catch {
      Alert.alert(t('results.exportErrorTitle'), t('results.exportErrorMessage'));
    } finally {
      setIsExportingCsv(false);
    }
  }, [i18n.language, isExportingCsv, result.tableItems, startDate, t]);

  const tabStrip = (
    <SegmentedControl
      value={activeTab}
      onChange={setActiveTab}
      options={tabs}
      variant={tabStyle === 'underline' ? 'underline' : 'primary'}
      textVariant={tabStyle === 'underline' ? 'labelMd' : 'labelSm'}
      style={[styles.tabControl, tabStyle === 'underline' && styles.underlineTabControl]}
    />
  );

  const tabBody = (
    <>
      {showFinancialDisclaimer ? (
        <FinancialDisclaimer dismissible style={styles.financialDisclaimer} />
      ) : null}

      {activeTab === 'summary' && (
        <View style={[styles.tabPanel, tabStyle === 'underline' && styles.underlineTabPanel]}>
          {summaryContent ?? (
            <LoanSummaryOverview
              result={result}
              startDate={startDate}
              currency={currency}
              mode={savedLoan ? 'saved' : 'calculation'}
              savedLoan={savedLoan}
              onShare={onShare}
              shareLabel={shareLabel}
              shareIcon={shareIcon}
            />
          )}
        </View>
      )}

      {activeTab === 'charts' && (
        <View style={[styles.tabPanel, tabStyle === 'underline' && styles.underlineTabPanel]}>
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <AppText variant="title3">{t('results.repaymentBreakdown')}</AppText>
            </View>
            <RepaymentBarChart
              monthlyArray={result.loanChartMonthlyArray}
              interestArray={result.loanChartInterestArray}
              labelArray={result.loanChartLabelArray}
              currency={currency}
            />
          </Card>
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <AppText variant="title3">{t('results.loanBreakdown')}</AppText>
            </View>
            <LoanBreakdownDonut
              principal={principalAmount}
              totalInterest={result.totalInterestPaid}
              currency={currency}
            />
          </Card>
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <AppText variant="title3">{t('results.cumulativePayments')}</AppText>
            </View>
            <CumulativeAreaChart
              monthlyArray={result.loanChartMonthlyArray}
              interestArray={result.loanChartInterestArray}
              remainingArray={result.loanChartRemainingArray}
              currency={currency}
            />
          </Card>
        </View>
      )}

      {activeTab === 'schedule' && (
        <Card style={[styles.chartCard, styles.scheduleCard, tabStyle === 'underline' && styles.underlineTabPanel]}>
          <View style={[styles.chartHeader, styles.scheduleHeader]}>
            <AppText variant="title3" style={styles.scheduleTitle}>{t('results.amortisationTable')}</AppText>
            <TouchableOpacity
              style={[styles.exportButton, isExportingCsv && styles.exportButtonDisabled]}
              onPress={handleExportCsv}
              disabled={isExportingCsv}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <AppText variant="labelSm" tone="accent" style={styles.exportButtonText}>
                {isExportingCsv ? t('results.exportingCsv') : t('results.exportCsv')}
              </AppText>
            </TouchableOpacity>
          </View>
          <AmortisationTable
            items={result.tableItems}
            startDate={startDate}
            currency={currency}
          />
        </Card>
      )}
    </>
  );

  if (ownsScroll) {
    return (
      <ScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stickyTabs}>{tabStrip}</View>
        {tabBody}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.root, style]}>
      {tabStrip}
      {tabBody}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {},
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing['3xl'],
  },
  stickyTabs: {
    marginHorizontal: -layout.screenPadding,
    backgroundColor: colours.background,
    zIndex: 2,
    elevation: 2,
  },
  tabControl: { marginBottom: spacing.sm },
  underlineTabControl: {
    marginHorizontal: -layout.screenPadding,
    marginBottom: 0,
  },
  financialDisclaimer: {
    marginTop: spacing.sm,
  },
  underlineTabPanel: {
    marginTop: spacing.sm,
  },
  tabPanel: {
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colours.border,
  },
  chartHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  scheduleTitle: {
    flex: 1,
  },
  exportButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.button,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    textTransform: 'uppercase',
  },
  scheduleCard: {
    paddingBottom: 8,
  },
});
