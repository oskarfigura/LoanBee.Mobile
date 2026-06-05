import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let capturedLineProps: Record<string, any> | null = null;

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement('View', props, children),
    Text: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement('Text', props, children),
    ScrollView: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement('ScrollView', props, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

jest.mock('react-native-gifted-charts', () => ({
  LineChart: (props: Record<string, any>) => {
    capturedLineProps = props;
    return null;
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { MortgageBalanceChart } from '../../src/components/charts/MortgageBalanceChart';

const buildSeries = (length: number, step: number) => (
  Array.from({ length }, (_, index) => Math.max(0, 300000 - (index * step)))
);

beforeEach(() => {
  capturedLineProps = null;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('MortgageBalanceChart', () => {
  it('renders a single-series mortgage balance curve when no baseline is present', () => {
    act(() => {
      create(React.createElement(MortgageBalanceChart, {
        scenarioRemaining: buildSeries(121, 1200),
        currency: 'GBP',
      }));
    });

    expect(capturedLineProps?.data2).toBeUndefined();
    expect(capturedLineProps?.color).toBeDefined();
  });

  it('condenses comparison points to fit a narrow viewport before falling back to scroll', () => {
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(React.createElement(MortgageBalanceChart, {
        scenarioRemaining: buildSeries(301, 900),
        baselineRemaining: buildSeries(301, 700),
        currency: 'GBP',
        comparisonLabelKeys: {
          baseline: 'overpayments.withoutOverpayments',
          scenario: 'overpayments.withOverpayments',
        },
      }));
    });

    const layoutNode = renderer.root.findAll(node => (
      String(node.type) === 'View' && typeof node.props.onLayout === 'function'
    ))[0];

    act(() => {
      layoutNode.props.onLayout({ nativeEvent: { layout: { width: 320 } } });
    });

    expect(capturedLineProps?.data2).toBeDefined();
    expect(capturedLineProps?.spacing).toBeLessThan(44);
    expect(capturedLineProps?.disableScroll).toBe(true);
    expect(capturedLineProps?.curvature).toBe(0.08);
    expect(capturedLineProps?.data.some((point: Record<string, unknown>) => 'spacing' in point)).toBe(false);
    expect(capturedLineProps?.data2.some((point: Record<string, unknown>) => 'spacing' in point)).toBe(false);
  });

  it('does not render a flat zero tail after the baseline has paid off', () => {
    const baseline = Array.from(
      { length: 253 },
      (_, index) => (index >= 251 ? 0 : 252 - index),
    );

    act(() => {
      create(React.createElement(MortgageBalanceChart, {
        scenarioRemaining: buildSeries(220, 1400),
        baselineRemaining: baseline,
        currency: 'GBP',
        comparisonLabelKeys: {
          baseline: 'overpayments.withoutOverpayments',
          scenario: 'overpayments.withOverpayments',
        },
      }));
    });

    const baselineData = capturedLineProps?.data as Array<{ value: number }>;
    const last = baselineData[baselineData.length - 1];
    const penultimate = baselineData[baselineData.length - 2];

    expect(last.value).toBe(0);
    expect(penultimate.value).toBeGreaterThan(0);
  });
});
