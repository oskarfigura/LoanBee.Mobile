import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type StackSegment = { value: number };
type StackDatum = { stacks: StackSegment[]; label: string; topLabelComponent?: () => React.ReactNode };
let capturedStackData: StackDatum[] | null = null;
let capturedBarProps: Record<string, any> | null = null;

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
  BarChart: (props: Record<string, any> & { stackData: StackDatum[] }) => {
    capturedStackData = props.stackData;
    capturedBarProps = props;
    return null;
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../src/currency/format', () => ({
  formatCurrencyCompact: (value: number) => `£${value}`,
}));

import { RepaymentBarChart } from '../../src/components/charts/RepaymentBarChart';

const buildArrays = (months = 36) => {
  const monthly: number[] = [];
  const interest: number[] = [];
  const lump: number[] = [];
  for (let m = 0; m <= months; m += 1) {
    monthly.push(m * 1000 + (m >= 13 ? 5000 : 0));
    interest.push(m * 200);
    lump.push(m >= 13 ? 5000 : 0);
  }
  return { monthly, interest, lump };
};

beforeEach(() => {
  capturedStackData = null;
  capturedBarProps = null;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('RepaymentBarChart principal and interest handling', () => {
  it('shows only principal and interest even when projection data includes overpayments', () => {
    const { monthly, interest } = buildArrays();

    act(() => {
      create(React.createElement(RepaymentBarChart, {
        monthlyArray: monthly,
        interestArray: interest,
        currency: 'GBP',
      }));
    });

    const data = capturedStackData!;
    expect(data).toHaveLength(3);

    data.forEach(year => expect(year.stacks).toHaveLength(2));
    expect(data.map(year => year.topLabelComponent)).toEqual([undefined, undefined, undefined]);

    // The year with an overpayment records that extra principal as principal,
    // rather than introducing a third chart category.
    expect(data[1].stacks[0].value).toBe(14600);
    expect(data[1].stacks[1].value).toBe(2400);
  });

  it('condenses bars and thins labels on narrow screens when requested', () => {
    const { monthly, interest } = buildArrays(300);
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(React.createElement(RepaymentBarChart, {
        monthlyArray: monthly,
        interestArray: interest,
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

    expect(capturedBarProps?.barWidth).toBeLessThan(18);
    expect(capturedBarProps?.spacing).toBeLessThan(14);
    expect(capturedBarProps?.disableScroll).toBe(true);
    expect(capturedStackData!.some(item => item.label === '')).toBe(true);
    expect(capturedStackData![capturedStackData!.length - 1].label).not.toBe('');
  });
});
