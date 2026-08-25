/**
 * Invalid-proof birthday input: month chips + day chips (no typing, so a bad
 * date like Feb 30 or 13/45 can't be entered). Emits a stored "MM-DD" once both
 * are chosen (or "" until then). Day choices are constrained to the selected
 * month's real length (Feb → 29 so leap-year birthdays are valid).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { DAYS_IN_MONTH, MONTHS } from '../utils/birthday';

interface Props {
  value: string; // stored "MM-DD" or ""
  onChange: (stored: string) => void;
  error?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function parse(value: string): { month: number | null; day: number | null } {
  const m = value.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return { month: null, day: null };
  return { month: Number(m[1]), day: Number(m[2]) };
}

export function BirthdayPicker({ value, onChange, error }: Props) {
  const { month, day } = parse(value);

  // "MM-DD" can't hold a month alone, so remember the in-progress month locally
  // to reveal the day chips before a day is picked.
  const [pendingMonth, setPendingMonth] = React.useState<number | null>(month);
  React.useEffect(() => {
    if (month) setPendingMonth(month);
  }, [month]);

  const activeMonth = pendingMonth ?? month;
  const activeDayCount = activeMonth ? DAYS_IN_MONTH[activeMonth - 1] : 0;

  const onMonth = (mo: number) => {
    setPendingMonth(mo);
    // Keep the day only if it's still valid for the new month, else reset.
    const keepDay = day && day <= DAYS_IN_MONTH[mo - 1] ? day : null;
    onChange(keepDay ? `${pad(mo)}-${pad(keepDay)}` : '');
  };
  const onDay = (dy: number) => {
    if (!activeMonth) return;
    onChange(`${pad(activeMonth)}-${pad(dy)}`);
  };

  return (
    <View>
      <Text style={styles.label}>Month</Text>
      <View style={styles.chipRow}>
        {MONTHS.map((name, i) => {
          const mo = i + 1;
          const on = activeMonth === mo;
          return (
            <Pressable
              key={name}
              onPress={() => onMonth(mo)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={name}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeMonth ? (
        <>
          <Text style={styles.label}>Day</Text>
          <View style={styles.chipRow}>
            {Array.from({ length: activeDayCount }, (_, i) => i + 1).map((dy) => {
              const on = month === activeMonth && day === dy;
              return (
                <Pressable
                  key={dy}
                  onPress={() => onDay(dy)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Day ${dy}`}
                  style={[styles.dayChip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{dy}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.line,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dayChip: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.tomato, borderColor: colors.tomato },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  chipTextOn: { color: '#FFFFFF' },
  error: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tomatoDeep, marginTop: spacing.sm },
});
