import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiDeal, dealShowsOnDate, fetchDeals } from '../data/api';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { buildMonthGrid, isSameDay, MONTH_NAMES, WEEKDAY_LABELS } from '../utils/date';

interface Props {
  onSelectDay: (date: Date) => void;
}

/**
 * Month calendar with future-only navigation. Starts on the current month;
 * ‹ / › step months but never before the current one. A day is dotted when at
 * least one deal actually falls on that exact date (see `dealShowsOnDate`).
 */
export function CalendarGrid({ onSelectDay }: Props) {
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  useEffect(() => {
    let active = true;
    fetchDeals()
      .then((d) => active && setDeals(d))
      .catch(() => active && setDeals([]));
    return () => {
      active = false;
    };
  }, []);

  // Future-only window: from the current month up to 11 months ahead.
  const currentIndex = today.getFullYear() * 12 + today.getMonth();
  const viewIndex = view.year * 12 + view.month;
  const isCurrentMonth = viewIndex <= currentIndex; // can't step before today's month
  const isMaxMonth = viewIndex >= currentIndex + 11; // can't step past 11 months ahead
  const step = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const days = buildMonthGrid(view.year, view.month);
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <View style={styles.container}>
      {/* Month header + future-only navigation */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() => !isCurrentMonth && step(-1)}
          disabled={isCurrentMonth}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
        >
          <Text style={[styles.navText, isCurrentMonth && styles.navTextDisabled]}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[view.month]} {view.year}
        </Text>
        <Pressable
          onPress={() => !isMaxMonth && step(1)}
          disabled={isMaxMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          style={[styles.navBtn, isMaxMonth && styles.navBtnDisabled]}
        >
          <Text style={[styles.navText, isMaxMonth && styles.navTextDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.weekLabel}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.body}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((date, di) => {
              const inMonth = date.getMonth() === view.month;
              const isToday = isSameDay(date, today);
              const hasDeals = inMonth && deals.some((deal) => dealShowsOnDate(deal, date));
              return (
                <Pressable
                  key={di}
                  onPress={() => onSelectDay(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getDate()}${hasDeals ? ', has deals' : ''}`}
                  style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
                >
                  <View
                    style={[
                      styles.dayInner,
                      inMonth && styles.dayInMonth,
                      isToday && styles.today,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        !inMonth && styles.dayMuted,
                        isToday && styles.todayNum,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {hasDeals && <View style={[styles.dot, isToday && styles.dotOnToday]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  navBtnDisabled: { backgroundColor: 'transparent' },
  navText: { fontFamily: fonts.display, fontSize: 24, color: colors.tomato, marginTop: -3 },
  navTextDisabled: { color: colors.inkFaint },
  weekHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.inkFaint,
  },
  body: { flex: 1 },
  weekRow: { flex: 1, flexDirection: 'row', marginBottom: spacing.xs },
  cell: { flex: 1, padding: 3 },
  cellPressed: { opacity: 0.6 },
  dayInner: {
    flex: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInMonth: { backgroundColor: colors.card, ...shadow.soft },
  today: { backgroundColor: colors.tomato },
  dayNum: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  dayMuted: { color: colors.inkFaint },
  todayNum: { color: '#FFFFFF' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mustard,
    marginTop: 2,
  },
  dotOnToday: { backgroundColor: '#FFFFFF' },
});
