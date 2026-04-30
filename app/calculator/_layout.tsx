import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colours, fonts, fontSizes } from '@/theme';

export default function CalculatorLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colours.primary },
        headerTintColor: colours.white,
        headerTitleStyle: {
          fontFamily: fonts.heading,
          fontSize: fontSizes.md,
        },
      }}
    >
      <Stack.Screen
        name="result"
        options={{
          title: t('results.title'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
