import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { weekdaysWithDeals } from '../data/mockData';
import { Weekday } from '../data/types';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { buildMonthGrid, isSameDay, WEEKDAY_LABELS } from '../utils/date';

interface Props {
  year: number;
  month: number;
  onSelectDay: (date: Date) => void;
}

const DEAL_DAYS: Set<Weekday> = weekdaysWithDeals();

export function CalendarGrid({ year, month, onSelectDay }: Props) {
  const cells = buildMonthGrid(year, month);
  const today = new Date();

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.weekHeader}>
        {WEEKDAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.weekLabel}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map(({ date, inMonth }, i) => {
          const isToday = isSameDay(date, today);
          const hasDeals = inMonth && DEAL_DAYS.has(date.getDay() as Weekday);
          return (
            <Pressable
              key={i}
              onPress={() => onSelectDay(date)}
              accessibilityRole="button"
              accessibilityLabel={`${date.getDate()}${hasDeals ? ', has deals' : ''}`}
              style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
            >
              <View style={[styles.dayInner, isToday && styles.today]}>
                <Text
                  style={[
                    styles.dayNum,
                    !inMonth && styles.dayMuted,
                    isToday && styles.todayNum,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
              {hasDeals ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  weekHeader: { flexDirection: 'row', marginBottom: spacing.sm },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.inkFaint,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPressed: { opacity: 0.6 },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { backgroundColor: colors.tomato },
  dayNum: { fontFamily: fonts.displaySemi, fontSize: 17, color: colors.ink },
  dayMuted: { color: colors.inkFaint },
  todayNum: { color: '#FFFFFF' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mustard,
    marginTop: 2,
  },
  dotSpacer: { height: 8, marginTop: 2 },
});
