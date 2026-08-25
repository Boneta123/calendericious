/**
 * Calendar popup for picking a single date (used for a deal's From/Through
 * range). Future-only — past days are disabled and the month can't step before
 * the current month. An optional `minDate` disables anything earlier (so the
 * "Through" calendar can't pick a day before "From"). Returns a Date; the caller
 * serializes to "MM/DD". Reuses utils/date so there's no date dependency.
 */
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { buildMonthGrid, isSameDay, MONTH_NAMES, WEEKDAY_LABELS } from '../utils/date';

interface Props {
  visible: boolean;
  title?: string;
  selected: Date | null;
  /** Earliest selectable day (inclusive). Defaults to today. */
  minDate?: Date | null;
  onSelect: (date: Date) => void;
  onClear: () => void;
  onClose: () => void;
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function CalendarPickerModal({
  visible,
  title = 'Pick a date',
  selected,
  minDate,
  onSelect,
  onClear,
  onClose,
}: Props) {
  const today = midnight(new Date());
  const floor = minDate ? midnight(minDate) : today;
  const start = selected ?? floor;
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });

  // Keep the view in sync with the current selection/floor when reopened.
  const openKey = `${visible}-${start.getFullYear()}-${start.getMonth()}`;
  const [lastKey, setLastKey] = useState(openKey);
  if (visible && openKey !== lastKey) {
    setLastKey(openKey);
    setView({ year: start.getFullYear(), month: start.getMonth() });
  }

  const floorIndex = floor.getFullYear() * 12 + floor.getMonth();
  const viewIndex = view.year * 12 + view.month;
  const atFloorMonth = viewIndex <= floorIndex;
  const step = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const days = buildMonthGrid(view.year, view.month);
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.monthHeader}>
            <Pressable
              onPress={() => !atFloorMonth && step(-1)}
              disabled={atFloorMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={[styles.navBtn, atFloorMonth && styles.navBtnDisabled]}
            >
              <Text style={[styles.navText, atFloorMonth && styles.navTextDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[view.month]} {view.year}
            </Text>
            <Pressable
              onPress={() => step(1)}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.navBtn}
            >
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((date, di) => {
                const inMonth = date.getMonth() === view.month;
                const disabled = midnight(date) < floor;
                const isSel = selected && isSameDay(date, selected);
                return (
                  <Pressable
                    key={di}
                    onPress={() => !disabled && onSelect(midnight(date))}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !!isSel, disabled }}
                    accessibilityLabel={`${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`}
                    style={styles.cell}
                  >
                    <View style={[styles.dayInner, isSel && styles.daySelected]}>
                      <Text
                        style={[
                          styles.dayNum,
                          !inMonth && styles.dayMuted,
                          disabled && styles.dayDisabled,
                          isSel && styles.daySelectedNum,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable onPress={onClear} accessibilityRole="button" style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.paper, borderRadius: radii.lg, padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: spacing.md, textAlign: 'center' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  navBtn: { width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  navBtnDisabled: { backgroundColor: 'transparent' },
  navText: { fontFamily: fonts.display, fontSize: 24, color: colors.tomato, marginTop: -3 },
  navTextDisabled: { color: colors.inkFaint },
  weekHeader: { flexDirection: 'row', marginBottom: spacing.xs },
  weekLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.monoBold, fontSize: 12, color: colors.inkFaint },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, padding: 2, aspectRatio: 1 },
  dayInner: { flex: 1, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.tomato },
  dayNum: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  dayMuted: { color: colors.inkFaint },
  dayDisabled: { color: colors.inkFaint, opacity: 0.4 },
  daySelectedNum: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  clearBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  clearText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  doneBtn: { backgroundColor: colors.tomato, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#FFFFFF' },
});
