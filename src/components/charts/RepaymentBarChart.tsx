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
  fitToWidth?: boolean;
}

const SAMPLE_STEP = 12;
const BAR_WIDTH = 18;
const BAR_SPACING = 14;
const INITIAL_SPACING = 8;
const END_SPACING = 16;
const MIN_BAR_SLOT = 10;
const MIN_LABEL_GAP = 34;
const X_LABEL_WIDTH = 34;

type StackSegment = {
  value: number;
  color: string;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
};

export const RepaymentBarChart = ({
  monthlyArray,
  interestArray,
  currency,
  height = 196,
  fitToWidth = false,
}: Props) => {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);

  const rawYearlyData = [];
  for (let i = SAMPLE_STEP; i < monthlyArray.length; i += SAMPLE_STEP) {
    const totalPaid = monthlyArray[i] - monthlyArray[i - SAMPLE_STEP];
    const interestPaid = interestArray[i] - interestArray[i - SAMPLE_STEP];
    const principalPaid = Math.max(0, totalPaid - interestPaid);
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
    rawYearlyData.push({
      stacks,
      year,
    });
  }

  if (rawYearlyData.length === 0) return null;

  const { chartWidth, scrollEnabled, pointSpacing } = getProjectionChartLayout({
    containerWidth,
    pointCount: rawYearlyData.length,
    perPointWidth: BAR_WIDTH + BAR_SPACING,
    edgeSpacing: INITIAL_SPACING + END_SPACING,
    fitToWidth,
    minPerPointWidth: MIN_BAR_SLOT,
  });
  const barSlot = fitToWidth ? pointSpacing : BAR_WIDTH + BAR_SPACING;
  const barWidth = fitToWidth
    ? Math.max(6, Math.min(BAR_WIDTH, Math.floor(barSlot * 0.58)))
    : BAR_WIDTH;
  const spacing = fitToWidth
    ? Math.max(3, barSlot - barWidth)
    : BAR_SPACING;
  const labelEvery = fitToWidth
    ? Math.max(1, Math.ceil(MIN_LABEL_GAP / pointSpacing))
    : 1;
  const lastPosition = rawYearlyData.length - 1;
  const yearlyData = rawYearlyData.map((item, position) => ({
    ...item,
    label: !fitToWidth || position === lastPosition || position % labelEvery === 0
      ? `Y${item.year}`
      : '',
    labelWidth: X_LABEL_WIDTH,
  }));

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
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={INITIAL_SPACING}
          endSpacing={END_SPACING}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          xAxisTextNumberOfLines={1}
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
