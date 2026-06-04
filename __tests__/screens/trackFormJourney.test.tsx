import React from 'react';
import { act, create, ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
  replace: jest.fn(),
};
const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockRecordUsefulAction = jest.fn(() => Promise.resolve());
const mockRequestReview = jest.fn(() => Promise.resolve(false));
const originalConsoleError = console.error;

jest.mock('react-native', () => {
  const React = require('react');

  return {
    StyleSheet: { create: (styles: unknown) => styles },
    TouchableOpacity: ({ children, ...props }: { children?: React.ReactNode }) => (
      React.createElement('TouchableOpacity', props, children)
    ),
    View: ({ children, ...props }: { children?: React.ReactNode }) => (
      React.createElement('View', props, children)
    ),
  };
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => mockRouter,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../src/hooks/useSavedLoans', () => ({
  useSavedLoans: () => ({
    add: mockAdd,
    update: mockUpdate,
  }),
}));

jest.mock('../../src/storage/mmkv', () => ({
  storage: {
    getString: jest.fn(() => 'GBP'),
  },
}));

jest.mock('../../src/storage/savedLoans', () => ({
  savedLoansStorage: {
    getById: jest.fn(() => undefined),
    getMaxDashboardOrder: jest.fn(() => 0),
    remove: jest.fn(),
  },
}));

jest.mock('../../src/review', () => ({
  useStoreReview: () => ({
    recordUsefulAction: mockRecordUsefulAction,
    requestReview: mockRequestReview,
  }),
}));

jest.mock('../../src/components/calculator/CurrencyPicker', () => ({
  CurrencyPicker: (props: Record<string, unknown>) => React.createElement('CurrencyPicker', props),
}));

jest.mock('../../src/components/loans/LenderTextInput', () => ({
  LenderTextInput: (props: Record<string, unknown>) => React.createElement('LenderTextInput', props),
}));

jest.mock('../../src/components/mortgage/OverpaymentEntryRow', () => ({
  OverpaymentEntryRow: (props: Record<string, unknown>) => React.createElement('OverpaymentEntryRow', props),
}));

jest.mock('../../src/components/ui/AppText', () => ({
  AppText: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('AppText', props, children)
  ),
}));

jest.mock('../../src/components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => React.createElement('Button', props),
}));

jest.mock('../../src/components/ui/DatePickerField', () => ({
  DatePickerField: (props: Record<string, unknown>) => React.createElement('DatePickerField', props),
}));

jest.mock('../../src/components/ui/KeyboardAwareFormScreen', () => ({
  KeyboardAwareFormScreen: ({ children, footer, ...props }: { children?: React.ReactNode; footer?: React.ReactNode }) => (
    React.createElement('KeyboardAwareFormScreen', props, children, footer)
  ),
}));

jest.mock('../../src/components/ui/FormPrimitives', () => ({
  AppTextInput: (props: Record<string, unknown>) => React.createElement('AppTextInput', props),
  FieldError: (props: Record<string, unknown>) => React.createElement('FieldError', props),
  FieldHint: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('FieldHint', props, children)
  ),
  FieldLabel: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('FieldLabel', props, children)
  ),
  FormSection: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('FormSection', props, children)
  ),
  InputAffix: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('InputAffix', props, children)
  ),
  InputSurface: ({ children, ...props }: { children?: React.ReactNode }) => (
    React.createElement('InputSurface', props, children)
  ),
  SegmentedControl: (props: Record<string, unknown>) => React.createElement('SegmentedControl', props),
}));

jest.mock('../../src/components/ui/Icons/SaveIcon/SaveIcon', () => ({
  SaveIcon: (props: Record<string, unknown>) => React.createElement('SaveIcon', props),
}));

const textContent = (node: ReactTestInstance | string | number | null | undefined): string => {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node.children.map(child => textContent(child as ReactTestInstance | string | number)).join('');
};

const renderTrack = async (): Promise<ReactTestRenderer> => {
  const TrackScreen = (await import('../../app/saved/track')).default;
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(React.createElement(TrackScreen));
  });

  return renderer as ReactTestRenderer;
};

const getStartDateField = (renderer: ReactTestRenderer): ReactTestInstance => (
  renderer.root.findAll(node => String(node.type) === 'DatePickerField').find(node => node.props.label === 'track.dealStartDate')!
);

const getCategoryToggle = (renderer: ReactTestRenderer): ReactTestInstance => (
  renderer.root.findAll(node => String(node.type) === 'SegmentedControl').find(node => (
    (node.props.options as Array<{ value: string }>).some(option => option.value === 'loan')
  ))!
);

const hasMortgageRepaymentToggle = (renderer: ReactTestRenderer): boolean => (
  renderer.root.findAll(node => String(node.type) === 'SegmentedControl').some(node => (
    (node.props.options as Array<{ value: string }>).some(option => option.value === 'interestOnly')
  ))
);

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((message?: unknown, ...args: unknown[]) => {
    if (typeof message === 'string' && message.includes('react-test-renderer is deprecated')) {
      return;
    }
    originalConsoleError(message, ...args);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('Track form journey', () => {
  it('uses one start-date field with category-aware hint copy and no minimum date', async () => {
    const renderer = await renderTrack();
    const startDateField = getStartDateField(renderer);

    expect(startDateField.props.hint).toBe('track.dealStartDateHint');
    expect(startDateField.props.minimumDate).toBeUndefined();
    expect(textContent(renderer.root)).toContain('track.currentBalance');
    expect(textContent(renderer.root)).toContain('track.remainingTerm');

    await act(async () => {
      startDateField.props.onChange('2019-01-01');
    });

    expect(textContent(renderer.root)).toContain('track.startingBalance');
    expect(textContent(renderer.root)).toContain('track.originalTerm');

    await act(async () => {
      getCategoryToggle(renderer).props.onChange('loan');
    });

    expect(getStartDateField(renderer).props.hint).toBe('track.dealStartDateHintLoan');
  });

  it('keeps loans on the single-deal path by hiding mortgage-only controls', async () => {
    const renderer = await renderTrack();

    expect(hasMortgageRepaymentToggle(renderer)).toBe(true);

    await act(async () => {
      getCategoryToggle(renderer).props.onChange('loan');
    });

    expect(hasMortgageRepaymentToggle(renderer)).toBe(false);
    expect(renderer.root.findAll(node => String(node.type) === 'DatePickerField').some(node => node.props.label === 'track.dealEndDate')).toBe(false);
  });
});
