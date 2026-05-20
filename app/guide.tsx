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
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
} from '@/onboarding/sampleScenario';
import { getDefaultCurrency } from '@/hooks/useLoanCalculatorForm';
import { CurrencyCode, CURRENCIES } from '@/currency/currencies';
import { colours, fontFaces, layout, radii, spacing } from '@/theme';

interface Slide {
  icon: string;
  theme: string;
  title: string;
  subtitle: string;
  example?: boolean;
}

interface ChartData {
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
  heroAccent: string;
}

const SLIDE_THEMES: Record<string, SlideTheme> = {
  primary: {
    cardBg: colours.primary,
    blobBg: colours.whiteSubtle,
    iconColor: colours.white,
    titleColor: colours.white,
    subtitleColor: colours.textInverse,
    heroAccent: colours.honey,
  },
  accent: {
    cardBg: colours.surfaceStrong,
    blobBg: colours.surfaceRaised,
    iconColor: colours.primary,
    titleColor: colours.primaryInk,
    subtitleColor: colours.textSecondary,
    heroAccent: colours.primary,
  },
  success: {
    cardBg: colours.successLight,
    blobBg: colours.surfaceRaised,
    iconColor: colours.success,
    titleColor: colours.primaryInk,
    subtitleColor: colours.textSecondary,
    heroAccent: colours.success,
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

  // Compute the example shown on slide 1 from the same scenario the "Try it
  // now" CTA prefills, so the headline savings figure and the sparkline curves
  // both match the calculator result.
  const chartData: ChartData = useMemo(() => {
    const currency = getDefaultCurrency();
    const scenario = getSampleScenario(currency);
    return {
      savings: computeSampleSavings(scenario),
      currency,
    };
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

  if (slide.example) {
    return (
      <View style={[styles.slideOuter, { width }]}>
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <View style={styles.exampleInner}>
            <Animated.View style={[styles.exampleTextWrap, textStyle]}>
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
            </Animated.View>
            <Animated.View style={[styles.heroExample, heroStyle]}>
              <SavingsHero chartData={chartData} />
            </Animated.View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.slideOuter, { width }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <View style={styles.cardInner}>
          <Animated.View style={[styles.iconWrap, heroStyle]}>
            <View style={[styles.blob, { backgroundColor: theme.blobBg }]} />
            <Icon color={theme.iconColor} size={104} strokeWidth={1.6} />
          </Animated.View>
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
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function useCountUp(target: number, duration = 1100, delay = 120): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let startTime: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    timeout = setTimeout(() => {
      startTime = Date.now();
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      if (timeout) clearTimeout(timeout);
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

interface SavingsHeroProps {
  chartData: ChartData;
}

function SavingsHero({ chartData }: SavingsHeroProps) {
  const { t } = useTranslation();
  const { savings, currency } = chartData;
  const symbol = (CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]).symbol;
  const heroTarget = Math.round(savings.interestSaved / 1000) * 1000;
  const animatedValue = useCountUp(heroTarget);
  const yearsSaved = Math.round(savings.monthsSaved / 12);

  return (
    <View style={styles.heroPanel}>
      <View style={styles.heroHeader}>
        <View style={styles.exampleBadge}>
          <View style={styles.exampleBadgeDot} />
          <AppText style={styles.exampleBadgeText}>
            {t('guide.exampleBadge')}
          </AppText>
        </View>
        <View style={styles.yearsPill}>
          <AppText style={styles.yearsPillText}>
            {t('guide.yearsSooner', { years: yearsSaved })}
          </AppText>
        </View>
      </View>

      <View style={styles.heroBody}>
        <AppText style={styles.heroLabel}>{t('guide.heroLabel')}</AppText>
        <AppText
          style={styles.heroNumber}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {`${symbol}${animatedValue.toLocaleString('en-GB')}`}
        </AppText>
        <AppText style={styles.heroSuffix}>{t('guide.heroSuffix')}</AppText>
      </View>

      <AppText style={styles.exampleDisclaimerInline}>
        {t('guide.exampleDisclaimer')}
      </AppText>
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
    paddingVertical: spacing.xl,
  },
  cardInner: {
    flex: 1,
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
  exampleInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  exampleTextWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
  },
  heroExample: {
    width: '100%',
    alignItems: 'center',
  },
  heroPanel: {
    width: '100%',
    backgroundColor: colours.surfaceRaised,
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  heroHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  exampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.full,
    backgroundColor: colours.honeySoft,
  },
  exampleBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colours.honey,
  },
  exampleBadgeText: {
    ...fontFaces.heading.bold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.4,
    color: colours.primary,
  },
  yearsPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.full,
    backgroundColor: colours.surfaceMuted,
  },
  yearsPillText: {
    ...fontFaces.heading.bold,
    fontSize: 12,
    lineHeight: 14,
    color: colours.primary,
  },
  heroBody: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  heroLabel: {
    ...fontFaces.body.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colours.textSecondary,
    marginBottom: spacing.xs,
  },
  heroNumber: {
    ...fontFaces.heading.extrabold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
    color: colours.primaryInk,
    textAlign: 'center',
  },
  heroSuffix: {
    ...fontFaces.body.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colours.textSecondary,
    marginTop: spacing.xs,
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
  exampleDisclaimerInline: {
    ...fontFaces.body.regular,
    fontSize: 10,
    lineHeight: 13,
    color: colours.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
    opacity: 0.7,
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
