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

import { CumulativeAreaChart } from '../../src/components/charts/CumulativeAreaChart';

const buildArrays = (months = 216) => ({
  monthly: Array.from({ length: months }, (_, index) => index * 1200),
  interest: Array.from({ length: months }, (_, index) => index * 250),
  remaining: Array.from({ length: months }, (_, index) => Math.max(0, 140000 - (index * 400))),
});

const textContent = (node: any): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (typeof node.props?.text === 'string') return node.props.text;
  return textContent(node.props?.children);
};

beforeEach(() => {
  capturedLineProps = null;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('CumulativeAreaChart', () => {
  it('scales the y-axis from all cumulative payment series', () => {
    const { monthly, interest, remaining } = buildArrays();

    act(() => {
      create(React.createElement(CumulativeAreaChart, {
        monthlyArray: monthly,
        interestArray: interest,
        remainingArray: remaining,
        currency: 'GBP',
      }));
    });

    const allValues = [
      ...capturedLineProps!.data,
      ...capturedLineProps!.data2,
      ...capturedLineProps!.data3,
    ].map((point: Record<string, number>) => point.value);

    expect(Math.max(...capturedLineProps!.data2.map((point: Record<string, number>) => point.value)))
      .toBeGreaterThan(Math.max(...capturedLineProps!.data.map((point: Record<string, number>) => point.value)));
    expect(capturedLineProps!.maxValue).toBeGreaterThan(Math.max(...allValues));
  });

  it('uses the full fitted viewport width without stretching the data spacing', () => {
    const { monthly, interest, remaining } = buildArrays();
    let renderer!: ReturnType<typeof create>;

    act(() => {
      renderer = create(React.createElement(CumulativeAreaChart, {
        monthlyArray: monthly,
        interestArray: interest,
        remainingArray: remaining,
        currency: 'GBP',
        fitToWidth: true,
      }));
    });

    const layoutNode = renderer.root.findAll(node => (
      String(node.type) === 'View' && typeof node.props.onLayout === 'function'
    ))[0];

    act(() => {
      layoutNode.props.onLayout({ nativeEvent: { layout: { width: 360 } } });
    });

    expect(capturedLineProps?.width).toBe(294);
    expect(capturedLineProps?.spacing).toBe(Math.floor((294 - 35) / 17));
    expect(capturedLineProps?.disableScroll).toBe(true);
  });

  it('labels the cumulative timeline from the first completed year through the final year', () => {
    const { monthly, interest, remaining } = buildArrays();

    act(() => {
      create(React.createElement(CumulativeAreaChart, {
        monthlyArray: monthly,
        interestArray: interest,
        remainingArray: remaining,
        currency: 'GBP',
        fitToWidth: true,
      }));
    });

    const labels = capturedLineProps?.data
      .map((point: Record<string, any>) => point.labelComponent?.())
      .filter(Boolean)
      .map(textContent);

    expect(labels?.[0]).toBe('Yr 1');
    expect(labels).toContain('Yr 18');
  });
});
