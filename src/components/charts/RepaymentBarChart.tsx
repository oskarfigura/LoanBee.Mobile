import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { colours, fontFaces, fontSizes } from '@/theme';
import { formatCurrencyCompact } from '@/currency/format';
import { CurrencyCode } from '@/currency/currencies';
import { getProjectionChartLayout } from './dimensions';

interface Props {
  monthlyArray: number[];
  interestArray: number[];
  currency: CurrencyCode;
  height?: number;
  // Optional cumulative lump-overpayment series, parallel to monthlyArray. When
  // provided, lump overpayments are flagged with a marker above the affected year
  // instead of being stacked into the bar — a one-off overpayment shouldn't tower
  // over (and crush the scale of) every other year's scheduled repayment.
  lumpArray?: number[];
}

const SAMPLE_STEP = 12;
const BAR_WIDTH = 18;
const BAR_SPACING = 14;
const INITIAL_SPACING = 8;
const END_SPACING = 16;

type StackSegment = {
  value: number;
  color: string;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
};

const OverpaymentMarker = ({ amount, currency }: { amount: number; currency: CurrencyCode }) => (
  <View style={styles.marker}>
    <Text style={styles.markerText} numberOfLines={1}>
      {`+${formatCurrencyCompact(amount, currency)}`}
    </Text>
  </View>
);

export const RepaymentBarChart = ({ monthlyArray, interestArray, currency, height = 196, lumpArray }: Props) => {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);

  const yearlyData = [];
  let anyLump = false;
  for (let i = SAMPLE_STEP; i < monthlyArray.length; i += SAMPLE_STEP) {
    const totalPaid = monthlyArray[i] - monthlyArray[i - SAMPLE_STEP];
    const interestPaid = interestArray[i] - interestArray[i - SAMPLE_STEP];
    const lumpPaid = lumpArray ? Math.max(0, lumpArray[i] - lumpArray[i - SAMPLE_STEP]) : 0;
    // Lump overpayments are part of totalPaid; pull them out so the principal segment
    // reflects scheduled repayment only and the bar height stays comparable year to year.
    const principalPaid = Math.max(0, totalPaid - interestPaid - lumpPaid);
    const hasLump = lumpPaid > 0.005;
    if (hasLump) anyLump = true;
    const year = Math.ceil(i / SAMPLE_STEP);
    const stacks: StackSegment[] = [
      {
        value: principalPaid,
        color: colours.primary,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
      },
      {
        value: interestPaid,
        color: colours.accent,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
      },
    ];
    yearlyData.push({
      stacks,
      label: `Y${year}`,
      ...(hasLump
        ? {
          topLabelComponent: () => <OverpaymentMarker amount={lumpPaid} currency={currency} />,
        }
        : {}),
    });
  }

  if (yearlyData.length === 0) return null;

  const { chartWidth, scrollEnabled } = getProjectionChartLayout({
    containerWidth,
    pointCount: yearlyData.length,
    perPointWidth: BAR_WIDTH + BAR_SPACING,
    edgeSpacing: INITIAL_SPACING + END_SPACING,
  });

  return (
    <View
      style={styles.container}
      onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal={scrollEnabled}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={scrollEnabled}
      >
        <BarChart
          stackData={yearlyData}
          width={chartWidth}
          height={height}
          barWidth={BAR_WIDTH}
          spacing={BAR_SPACING}
          initialSpacing={INITIAL_SPACING}
          endSpacing={END_SPACING}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          yAxisLabelWidth={42}
          xAxisLabelsHeight={24}
          rulesColor={colours.border}
          rulesThickness={1}
          xAxisColor={colours.border}
          yAxisColor={colours.border}
          yAxisThickness={1}
          xAxisThickness={1}
          showYAxisIndices={false}
          showXAxisIndices={false}
          formatYLabel={v => formatCurrencyCompact(+v, currency)}
          disableScroll={!scrollEnabled}
          adjustToWidth={!scrollEnabled}
          isAnimated
        />
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colours.primary }]} />
          <Text style={styles.legendText}>{t('results.principal')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colours.accent }]} />
          <Text style={styles.legendText}>{t('results.interest')}</Text>
        </View>
        {anyLump ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colours.teal }]} />
            <Text style={styles.legendText}>{t('results.overpayment')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 4, paddingBottom: 2 },
  axisText: {
    ...fontFaces.body.regular,
    fontSize: fontSizes.tiny,
    color: colours.textSecondary,
  },
  marker: {
    backgroundColor: colours.teal,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 4,
  },
  markerText: {
    ...fontFaces.heading.bold,
    fontSize: fontSizes.tiny,
    color: colours.white,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: {
    ...fontFaces.heading.semibold,
    fontSize: fontSizes.xs,
    color: colours.textSecondary,
  },
});
