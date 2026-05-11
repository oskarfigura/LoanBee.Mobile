import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colours, radii } from '@/theme';

interface Props {
  progress: number;
  color?: string;
}

export const ProgressBar = ({ progress, color = colours.teal }: Props) => (
  <View style={styles.track}>
    <View
      style={[
        styles.fill,
        { width: `${Math.max(0, Math.min(progress, 1)) * 100}%`, backgroundColor: color },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colours.surfaceStrong,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
});
