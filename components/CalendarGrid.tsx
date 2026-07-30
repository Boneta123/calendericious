import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { weekdaysWithDeals } from '../data/mockData';
import { Weekday } from '../data/types';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { buildTwoWeekGrid, isSameDay, WEEKDAY_LABELS } from '../utils/date';

interface Props {
  onSelectDay: (date: Date) => void;
}

const DEAL_DAYS: Set<Weekday> = weekdaysWithDeals();

/**
 * Two-week calendar: the current week + next week (14 days). No previous days,
 * no month navigation. Rows flex to fill whatever height the parent gives it.
 */
export function CalendarGrid({ onSelectDay }: Props) {
  const days = buildTwoWeekGrid(new Date());
  const today = new Date();
  const weeks = [days.slice(0, 7), days.slice(7, 14)];

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
              const isToday = isSameDay(date, today);
              const hasDeals = DEAL_DAYS.has(date.getDay() as Weekday);
              return (
                <Pressable
                  key={di}
                  onPress={() => onSelectDay(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getDate()}${hasDeals ? ', has deals' : ''}`}
                  style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
                >
                  <View style={[styles.dayInner, isToday && styles.today]}>
                    <Text style={[styles.dayNum, isToday && styles.todayNum]}>
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
  weekRow: { flex: 1, flexDirection: 'row', marginBottom: spacing.sm },
  cell: { flex: 1, padding: spacing.xs },
  cellPressed: { opacity: 0.6 },
  dayInner: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  today: { backgroundColor: colors.tomato },
  dayNum: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  todayNum: { color: '#FFFFFF' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mustard,
    marginTop: spacing.xs,
  },
  dotOnToday: { backgroundColor: '#FFFFFF' },
});
