import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type StackSegment = { value: number };
type StackDatum = { stacks: StackSegment[]; label: string; topLabelComponent?: () => React.ReactNode };
let capturedStackData: StackDatum[] | null = null;

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
  BarChart: (props: { stackData: StackDatum[] }) => {
    capturedStackData = props.stackData;
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

// Three years of £1,000/mo with £200/mo interest; a £5,000 lump lands in year 2.
const buildArrays = () => {
  const monthly: number[] = [];
  const interest: number[] = [];
  const lump: number[] = [];
  for (let m = 0; m <= 36; m += 1) {
    monthly.push(m * 1000 + (m >= 13 ? 5000 : 0));
    interest.push(m * 200);
    lump.push(m >= 13 ? 5000 : 0);
  }
  return { monthly, interest, lump };
};

beforeEach(() => {
  capturedStackData = null;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('RepaymentBarChart overpayment handling', () => {
  it('flags the overpayment year with a marker and keeps it out of the bar stack', () => {
    const { monthly, interest, lump } = buildArrays();

    act(() => {
      create(React.createElement(RepaymentBarChart, {
        monthlyArray: monthly,
        interestArray: interest,
        lumpArray: lump,
        currency: 'GBP',
      }));
    });

    const data = capturedStackData!;
    expect(data).toHaveLength(3);

    // The lump must never inflate a bar segment — only principal + interest are stacked.
    const allSegmentValues = data.flatMap(year => year.stacks.map(segment => segment.value));
    expect(allSegmentValues).not.toContain(5000);
    data.forEach(year => expect(year.stacks).toHaveLength(2));

    // Year 2 (index 1) carries the overpayment, so only it gets a marker.
    expect(typeof data[1].topLabelComponent).toBe('function');
    expect(data[0].topLabelComponent).toBeUndefined();
    expect(data[2].topLabelComponent).toBeUndefined();
  });
});
