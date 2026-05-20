import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import {
  ArrowRightIcon,
  GridIcon,
  ShieldTickIcon,
  ZapIcon,
} from '@/components/ui/Icons';
import { SvgProps } from '@/components/ui/Svg';
import { markGuideSeen } from '@/onboarding/guideState';
import {
  computeSampleSavings,
  getSampleScenario,
  SampleSavings,
  SampleScenario,
} from '@/onboarding/sampleScenario';
import { getDefaultCurrency } from '@/hooks/useLoanCalculatorForm';
import { CurrencyCode } from '@/currency/currencies';
import { formatCurrencyCompact } from '@/currency/format';
import { colours, layout, radii, spacing } from '@/theme';

interface Slide {
  icon: string;
  theme: string;
  title: string;
  subtitle: string;
  example?: boolean;
}

interface ChartData {
  scenario: SampleScenario;
  savings: SampleSavings;
  currency: CurrencyCode;
}

type IconComponent = (props: SvgProps) => React.JSX.Element;

const SLIDE_ICONS: Record<string, IconComponent> = {
  overpay: ZapIcon,
  track: GridIcon,
  ready: ShieldTickIcon,
};

interface SlideTheme {
  cardBg: string;
  blobBg: string;
  iconColor: string;
  titleColor: string;
  subtitleColor: string;
}

const SLIDE_THEMES: Record<string, SlideTheme> = {
  primary: {
    cardBg: colours.primary,
    blobBg: colours.whiteSubtle,
    iconColor: colours.white,
    titleColor: colours.white,
    subtitleColor: colours.textInverse,
  },
  accent: {
    cardBg: colours.surfaceStrong,
    blobBg: colours.surfaceRaised,
    iconColor: colours.primary,
    titleColor: colours.primaryInk,
    subtitleColor: colours.textSecondary,
  },
  success: {
    cardBg: colours.successLight,
    blobBg: colours.surfaceRaised,
    iconColor: colours.success,
    titleColor: colours.primaryInk,
    subtitleColor: colours.textSecondary,
  },
};

export default function GuideScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ firstRun?: string }>();
  const isFirstRun = params.firstRun === '1';
  const { width } = useWindowDimensions();
  const slides = t('guide.slides', { returnObjects: true }) as Slide[];
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);

  // Compute the savings shown on the slide-1 chart from the same scenario the
  // "Try it now" CTA prefills, so the headline figure matches the calculator
  // result and the visible bar delta matches the headline savings.
  const chartData: ChartData = useMemo(() => {
    const currency = getDefaultCurrency();
    const scenario = getSampleScenario(currency);
    return { scenario, savings: computeSampleSavings(scenario), currency };
  }, []);

  // Reaching this screen counts as having seen the guide, so it never
  // re-triggers on next launch regardless of how the user leaves it.
  useEffect(() => {
    markGuideSeen();
  }, []);

  const scrollToIndex = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const leave = (sample: boolean) => {
    if (isFirstRun || sample) {
      router.replace(sample ? '/?sample=1' : '/');
    } else {
      router.back();
    }
  };

  const goNext = () => {
    if (index < slides.length - 1) scrollToIndex(index + 1);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const isLast = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        {!isLast ? (
          <TouchableOpacity
            onPress={() => leave(false)}
            accessibilityRole="button"
            accessibilityLabel={t('guide.skip')}
            hitSlop={8}
            style={styles.skipBtn}
          >
            <AppText variant="labelMd" tone="muted">{t('guide.skip')}</AppText>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.icon}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={styles.list}
        renderItem={({ item, index: i }) => (
          <SlideView
            slide={item}
            index={i}
            width={width}
            scrollX={scrollX}
            chartData={chartData}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <TouchableOpacity
              key={s.icon}
              onPress={() => scrollToIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${i + 1} of ${slides.length}`}
              hitSlop={8}
              style={styles.dotTap}
            >
              <View style={[styles.dot, i === index ? styles.dotActive : undefined]} />
            </TouchableOpacity>
          ))}
        </View>

        {isLast ? (
          <Button
            label={t('guide.tryItNow')}
            onPress={() => leave(true)}
            rightIcon={<ArrowRightIcon color={colours.white} size={18} strokeWidth={2} />}
          />
        ) : (
          <View style={styles.nextRow}>
            <Button
              label={t('guide.next')}
              variant="ghost"
              onPress={goNext}
              rightIcon={<ArrowRightIcon color={colours.primary} size={18} strokeWidth={2} />}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

interface SlideViewProps {
  slide: Slide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  chartData: ChartData;
}

function SlideView({ slide, index, width, scrollX, chartData }: SlideViewProps) {
  const { t } = useTranslation();
  const Icon = SLIDE_ICONS[slide.icon] ?? ZapIcon;
  const theme = SLIDE_THEMES[slide.theme] ?? SLIDE_THEMES.primary;
  const slideOffset = width * index;

  // Parallax: hero element drifts horizontally and fades slightly faster than
  // the rail, so each slide feels like its own scene rather than a flat page.
  const heroStyle = useAnimatedStyle(() => {
    const distance = scrollX.value - slideOffset;
    const opacity = interpolate(
      Math.abs(distance),
      [0, width * 0.8],
      [1, 0],
      'clamp',
    );
    const translateX = interpolate(
      distance,
      [-width, 0, width],
      [width * 0.22, 0, -width * 0.22],
    );
    return { opacity, transform: [{ translateX }] };
  });

  // Text settles in slightly later than the hero and fades over a tighter
  // range, which produces a soft cross-fade between adjacent slides.
  const textStyle = useAnimatedStyle(() => {
    const distance = scrollX.value - slideOffset;
    const opacity = interpolate(
      Math.abs(distance),
      [0, width * 0.55],
      [1, 0],
      'clamp',
    );
    const translateY = interpolate(
      Math.abs(distance),
      [0, width],
      [0, 22],
      'clamp',
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slideOuter, { width }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        {slide.example ? (
          <Animated.View style={[styles.chartHero, heroStyle]}>
            <SavingsChart chartData={chartData} theme={theme} />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.iconWrap, heroStyle]}>
            <View style={[styles.blob, { backgroundColor: theme.blobBg }]} />
            <Icon color={theme.iconColor} size={104} strokeWidth={1.6} />
          </Animated.View>
        )}

        <Animated.View style={[styles.textWrap, textStyle]}>
          <AppText
            variant="title1"
            style={[styles.slideTitle, { color: theme.titleColor }]}
          >
            {slide.title}
          </AppText>
          <AppText
            variant="bodyLg"
            style={[styles.slideSubtitle, { color: theme.subtitleColor }]}
          >
            {slide.subtitle}
          </AppText>
          {slide.example ? (
            <AppText
              variant="helper"
              style={[styles.exampleDisclaimer, { color: theme.subtitleColor }]}
            >
              {t('guide.exampleDisclaimer')}
            </AppText>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

interface SavingsChartProps {
  chartData: ChartData;
  theme: SlideTheme;
}

function SavingsChart({ chartData, theme }: SavingsChartProps) {
  const { t } = useTranslation();
  const { scenario, savings, currency } = chartData;
  const progress = useSharedValue(0);

  useEffect(() => {
    // Bars grow from zero to their final width on first render.
    progress.value = withDelay(
      120,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const baselineFmt = formatCurrencyCompact(savings.baselineInterest, currency);
  const withFmt = formatCurrencyCompact(savings.withOverpaymentInterest, currency);
  const monthlyFmt = formatCurrencyCompact(scenario.additionalMonthlyPayment, currency).replace(/\.00$/, '');
  const savingsFmt = formatCurrencyCompact(savings.interestSaved, currency);
  const years = Math.round(savings.monthsSaved / 12);
  const withRatio = savings.withOverpaymentInterest / savings.baselineInterest;

  const baselineBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100], 'clamp')}%`,
  }));

  const withBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, withRatio * 100], 'clamp')}%`,
  }));

  const summaryStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.6, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [0.6, 1], [8, 0], 'clamp') }],
  }));

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartRow}>
        <AppText
          variant="labelSm"
          style={[styles.chartCaption, { color: theme.subtitleColor }]}
        >
          {t('guide.exampleWithout')}
        </AppText>
        <AppText
          variant="labelMd"
          style={[styles.chartValue, { color: theme.titleColor }]}
        >
          {baselineFmt}
        </AppText>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, styles.barFillBaseline, baselineBarStyle]} />
      </View>

      <View style={[styles.chartRow, styles.chartRowGap]}>
        <AppText
          variant="labelSm"
          style={[styles.chartCaption, { color: theme.subtitleColor }]}
        >
          {t('guide.exampleWith', { amount: monthlyFmt })}
        </AppText>
        <AppText
          variant="labelMd"
          style={[styles.chartValue, { color: colours.honey }]}
        >
          {withFmt}
        </AppText>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, styles.barFillWith, withBarStyle]} />
      </View>

      <Animated.View style={[styles.chartSummaryWrap, summaryStyle]}>
        <AppText
          variant="title3"
          style={[styles.chartSummary, { color: theme.titleColor }]}
        >
          {t('guide.exampleSaves', { savings: savingsFmt, years })}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  topBar: {
    height: 48,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  skipBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  list: { flex: 1 },
  slideOuter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  blob: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: radii.full,
    opacity: 0.55,
  },
  chartHero: {
    width: '100%',
    maxWidth: 340,
    marginBottom: spacing.xl,
  },
  chartWrap: {
    width: '100%',
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xxs,
  },
  chartRowGap: {
    marginTop: spacing.md,
  },
  chartCaption: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.85,
  },
  chartValue: {},
  barTrack: {
    width: '100%',
    height: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  barFillBaseline: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  barFillWith: {
    backgroundColor: colours.honey,
  },
  chartSummaryWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  chartSummary: {
    textAlign: 'center',
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    maxWidth: 340,
  },
  slideSubtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  exampleDisclaimer: {
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.75,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dotTap: {
    padding: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colours.borderSoft,
  },
  dotActive: {
    width: 24,
    backgroundColor: colours.primary,
  },
  nextRow: {
    alignItems: 'flex-end',
  },
});
