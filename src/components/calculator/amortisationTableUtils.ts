export interface AmortisationTableItem {
  itemNo: number;
  remaining: string;
  principal: string;
  interest: string;
  ending: string;
}

const DEFAULT_LOCALE = 'en-GB';

const getLocale = (language: string) => (language === 'pl' ? 'pl-PL' : DEFAULT_LOCALE);

export const formatAmortisationPeriodLabel = (
  startDate: string,
  periodNumber: number,
  language: string,
) => {
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return String(periodNumber);

  date.setMonth(date.getMonth() + periodNumber - 1);

  return date.toLocaleDateString(getLocale(language), {
    month: 'short',
    year: 'numeric',
  });
};

const formatCsvNumber = (value: string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
};

const escapeCsvValue = (value: string) => {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

export const buildAmortisationCsv = ({
  items,
  startDate,
  language,
  headers,
}: {
  items: AmortisationTableItem[];
  startDate: string;
  language: string;
  headers: {
    period: string;
    openingBalance: string;
    principal: string;
    interest: string;
    closingBalance: string;
  };
}) => {
  const rows = [
    [
      headers.period,
      headers.openingBalance,
      headers.principal,
      headers.interest,
      headers.closingBalance,
    ],
    ...items.map(item => [
      formatAmortisationPeriodLabel(startDate, item.itemNo, language),
      formatCsvNumber(item.remaining),
      formatCsvNumber(item.principal),
      formatCsvNumber(item.interest),
      formatCsvNumber(item.ending),
    ]),
  ];

  return `\uFEFF${rows.map(row => row.map(cell => escapeCsvValue(cell)).join(',')).join('\n')}`;
};
