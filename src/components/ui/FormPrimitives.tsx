import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colours, elevation, fontFaces, fontSizes, layout, radii, spacing } from '@/theme';

export const FormSection = ({
  title,
  children,
  accent,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.section, accent && styles.sectionAccent, style]}>
    {title ? <AppText variant="title2" style={styles.sectionTitle}>{title}</AppText> : null}
    {children}
  </View>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <AppText variant="labelMd" style={styles.label}>
    {children}
  </AppText>
);

export const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <AppText variant="helper" tone="muted" style={styles.hint}>
    {children}
  </AppText>
);

export const FieldError = ({ message }: { message?: string }) => (
  message ? <AppText variant="helper" tone="error" style={styles.error}>{message}</AppText> : null
);

export const InputSurface = ({
  children,
  focused,
  error,
  multiline,
  style,
}: {
  children: React.ReactNode;
  focused?: boolean;
  error?: boolean;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <View
    style={[
      styles.inputSurface,
      multiline && styles.inputSurfaceMultiline,
      focused && styles.inputSurfaceFocused,
      error && styles.inputSurfaceError,
      style,
    ]}
  >
    {children}
  </View>
);

export const AppTextInput = React.forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => (
  <TextInput
    ref={ref}
    {...props}
    placeholderTextColor={props.placeholderTextColor ?? colours.textSecondary}
    style={[styles.textInput, style]}
  />
));

AppTextInput.displayName = 'AppTextInput';

export const InputAffix = ({ children, trailing }: { children: React.ReactNode; trailing?: boolean }) => (
  <AppText variant="bodyMd" tone="muted" style={trailing ? styles.affixTrailing : styles.affix}>
    {children}
  </AppText>
);

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  style,
  variant = 'surface',
  textVariant = 'labelMd',
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'primary' | 'underline';
  textVariant?: 'labelMd' | 'labelSm';
}) => {
  const isUnderline = variant === 'underline';

  return (
    <View style={[
      isUnderline ? styles.underlineTabs : styles.segmented,
      variant === 'primary' && styles.segmentedPrimary,
      style,
    ]}>
      {options.map(option => {
        const active = option.value === value;
        const textTone = active
          ? (variant === 'primary' ? 'inverse' : variant === 'underline' ? 'accent' : 'default')
          : 'muted';

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              isUnderline ? styles.underlineTab : styles.segment,
              active && !isUnderline && styles.segmentActive,
              variant === 'primary' && active && styles.segmentActivePrimary,
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.84}
          >
            {isUnderline ? (
              <View style={[styles.underlineTabContent, active && styles.underlineTabActive]}>
                <AppText variant={textVariant} tone={textTone}>
                  {option.label}
                </AppText>
              </View>
            ) : (
              <AppText variant={textVariant} tone={textTone}>
                {option.label}
              </AppText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const PillSelector = <T extends string>({
  value,
  options,
  onChange,
  wrap,
  style,
}: {
  value: T;
  options: Array<{ label: string; value: T; icon?: React.ReactNode }>;
  onChange: (next: T) => void;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const items = options.map(option => {
    const active = option.value === value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.pill, active && styles.pillActive]}
        onPress={() => onChange(option.value)}
        activeOpacity={0.84}
      >
        {option.icon}
        <AppText variant="labelMd" tone={active ? 'inverse' : 'accent'}>
          {option.label}
        </AppText>
      </TouchableOpacity>
    );
  });

  if (wrap) {
    return <View style={[styles.pillRow, styles.pillRowWrap, style]}>{items}</View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillRow, style]}>
      {items}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: colours.surfaceRaised,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colours.borderSoft,
    padding: layout.cardPadding,
    gap: spacing.sm,
    ...elevation.level1,
  },
  sectionAccent: {
    borderTopWidth: 3,
    borderTopColor: colours.tealDeep,
  },
  sectionTitle: {
    marginBottom: spacing.xxs,
  },
  label: {
    color: colours.primaryInk,
    marginBottom: spacing.xxs,
  },
  hint: {
    marginTop: spacing.xs,
  },
  error: {
    marginTop: spacing.xs,
  },
  inputSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colours.borderSoft,
    backgroundColor: colours.surfaceRaised,
    paddingHorizontal: spacing.sm,
  },
  inputSurfaceMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  inputSurfaceFocused: {
    borderColor: colours.secondary,
    shadowColor: colours.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 0,
  },
  inputSurfaceError: {
    borderColor: colours.error,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    color: colours.textPrimary,
    ...fontFaces.body.regular,
    fontSize: fontSizes.base,
    paddingVertical: spacing.xs,
  },
  affix: {
    marginRight: spacing.xs,
  },
  affixTrailing: {
    marginLeft: spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.input,
    backgroundColor: colours.surfaceAccent,
  },
  segmentedPrimary: {
    backgroundColor: colours.surfaceRaised,
    borderWidth: 1,
    borderColor: colours.border,
  },
  segment: {
    flex: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colours.surfaceRaised,
    borderWidth: 1,
    borderColor: colours.borderSoft,
  },
  segmentActivePrimary: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  underlineTabs: {
    flexDirection: 'row',
    backgroundColor: colours.background,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  underlineTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  underlineTabContent: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colours.background,
  },
  underlineTabActive: {
    borderBottomColor: colours.primary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  pillRowWrap: {
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colours.borderSoft,
    backgroundColor: colours.surfaceRaised,
  },
  pillActive: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
});
