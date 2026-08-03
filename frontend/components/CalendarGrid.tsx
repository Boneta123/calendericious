import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchDeals } from '../data/api';
import { Weekday } from '../data/types';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { buildMonthGrid, isSameDay, WEEKDAY_LABELS } from '../utils/date';

interface Props {
  onSelectDay: (date: Date) => void;
}

/**
 * Current-month calendar. Shows the month that contains today, padded with
 * adjacent (muted) days. Rows flex to fill whatever height the parent gives.
 */
export function CalendarGrid({ onSelectDay }: Props) {
  // Weekdays (0=Sun..6=Sat) that have at least one deal — dotted on the grid.
  const [dealDays, setDealDays] = useState<Set<Weekday>>(new Set());

  useEffect(() => {
    let active = true;
    fetchDeals()
      .then((deals) => {
        if (!active) return;
        const days = new Set<Weekday>();
        for (const deal of deals) {
          if (deal.daysOfWeek.length === 0) {
            for (let d = 0; d <= 6; d++) days.add(d as Weekday);
          } else {
            for (const d of deal.daysOfWeek) days.add(d as Weekday);
          }
        }
        setDealDays(days);
      })
      .catch(() => active && setDealDays(new Set()));
    return () => {
      active = false;
    };
  }, []);

  const today = new Date();
  const month = today.getMonth();
  const days = buildMonthGrid(today.getFullYear(), month);
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <View style={styles.container}>
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
              const inMonth = date.getMonth() === month;
              const isToday = isSameDay(date, today);
              const hasDeals = inMonth && dealDays.has(date.getDay() as Weekday);
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
