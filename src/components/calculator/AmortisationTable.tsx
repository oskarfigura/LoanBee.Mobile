import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colours, fonts, fontSizes, fontWeights } from '@/theme';
import { formatCurrency } from '@/currency/format';
import { CurrencyCode } from '@/currency/currencies';
import { clampPage, getPaginationWindow } from './pagination';
import {
  AmortisationTableItem,
  formatAmortisationPeriodLabel,
} from './amortisationTableUtils';

interface Props {
  items: AmortisationTableItem[];
  startDate: string;
  currency: CurrencyCode;
  pageSize?: number;
}

export const AmortisationTable = ({ items, startDate, currency, pageSize = 12 }: Props) => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [isPagePickerOpen, setIsPagePickerOpen] = useState(false);
  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = clampPage(page, totalPages);
  const pageItems = items.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const visiblePages = getPaginationWindow(safePage, totalPages, 5);
  const goToPage = (nextPage: number) => {
    setPage(clampPage(nextPage, totalPages));
    setIsPagePickerOpen(false);
  };
  const pageLabel = `${safePage + 1} / ${totalPages}`;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {[t('results.period'), t('results.openingBalance'), t('results.principal'), t('results.interest'), t('results.closingBalance')].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.headerCell,
                  i === 0 ? styles.indexCell : styles.headerNumericCell,
                ]}
              >
                {h}
              </Text>
            ))}
          </View>
          {pageItems.map((item, i) => (
            <View key={item.itemNo} style={[styles.dataRow, i % 2 === 0 && styles.evenRow]}>
              <Text style={[styles.cell, styles.indexCell]}>
                {formatAmortisationPeriodLabel(startDate, item.itemNo, i18n.language)}
              </Text>
              <Text style={styles.cell}>{formatCurrency(+item.remaining, currency)}</Text>
              <Text style={styles.cell}>{formatCurrency(+item.principal, currency)}</Text>
              <Text style={styles.cell}>{formatCurrency(+item.interest, currency)}</Text>
              <Text style={[styles.cell, styles.closingCell]}>{formatCurrency(+item.ending, currency)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {totalPages > 1 && (
        <View style={styles.paginationWrap}>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
              onPress={() => goToPage(safePage - 1)}
              disabled={safePage === 0}
            >
              <Text style={[styles.pageBtnText, safePage === 0 && styles.pageBtnTextDisabled]}>
                {t('results.previous')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageIndicator, isPagePickerOpen && styles.pageIndicatorActive]}
              onPress={() => setIsPagePickerOpen(current => !current)}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.pageIndicatorText}>{pageLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageBtn, safePage === totalPages - 1 && styles.pageBtnDisabled]}
              onPress={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages - 1}
            >
              <Text style={[styles.pageBtnText, safePage === totalPages - 1 && styles.pageBtnTextDisabled]}>
                {t('results.next')}
              </Text>
            </TouchableOpacity>
          </View>
          {isPagePickerOpen && (
            <View style={styles.pagePicker}>
              {visiblePages[0] > 0 ? (
                <>
                  <TouchableOpacity
                    style={styles.pageChip}
                    onPress={() => goToPage(0)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pageChipText}>1</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageEllipsis}>...</Text>
                </>
              ) : null}
              {visiblePages.map(pageNumber => (
                <TouchableOpacity
                  key={pageNumber}
                  style={[styles.pageChip, pageNumber === safePage && styles.pageChipActive]}
                  onPress={() => goToPage(pageNumber)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pageChipText, pageNumber === safePage && styles.pageChipTextActive]}>
                    {pageNumber + 1}
                  </Text>
                </TouchableOpacity>
              ))}
              {visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
                <>
                  <Text style={styles.pageEllipsis}>...</Text>
                  <TouchableOpacity
                    style={styles.pageChip}
                    onPress={() => goToPage(totalPages - 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pageChipText}>{totalPages}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableScrollContent: {
    paddingBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colours.primary,
  },
  headerCell: {
    width: 116,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colours.white,
    textAlignVertical: 'center',
  },
  headerNumericCell: {
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
    backgroundColor: colours.white,
  },
  evenRow: {
    backgroundColor: colours.surface,
  },
  cell: {
    width: 116,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textPrimary,
    textAlign: 'center',
  },
  indexCell: {
    width: 108,
    textAlign: 'left',
  },
  closingCell: {
    color: colours.primary,
    fontWeight: fontWeights.bold,
  },
  paginationWrap: {
    marginTop: 14,
    gap: 10,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageBtn: {
    minWidth: 92,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colours.white,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colours.border,
  },
  pageBtnDisabled: {
    backgroundColor: colours.surface,
  },
  pageBtnText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.primary,
  },
  pageBtnTextDisabled: {
    color: colours.textSecondary,
  },
  pageIndicator: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 21,
    backgroundColor: colours.surface,
  },
  pageIndicatorActive: {
    borderColor: colours.primary,
    backgroundColor: colours.white,
  },
  pageIndicatorText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.textPrimary,
    textAlign: 'center',
  },
  pagePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  pageChip: {
    minWidth: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.white,
  },
  pageChipActive: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  pageChipText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colours.textPrimary,
  },
  pageChipTextActive: {
    color: colours.white,
  },
  pageEllipsis: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colours.textSecondary,
  },
});
