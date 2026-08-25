/**
 * Time popup — pick from every hour and half-hour (48 slots, 12:00 AM → 11:30 PM).
 * The user can't type an invalid time; each option maps to a 24h "HH:MM" the
 * caller stores. A "Clear" option unsets the (optional) value.
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { formatClock } from '../utils/date';

interface Props {
  visible: boolean;
  title?: string;
  value: string | null; // "HH:MM" 24h
  onSelect: (time: string) => void;
  onClear: () => void;
  onClose: () => void;
}

// 48 half-hour slots: "00:00", "00:30", … "23:30".
const SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export function TimePickerModal({ visible, title = 'Pick a time', value, onSelect, onClear, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {SLOTS.map((slot) => {
              const on = value === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => onSelect(slot)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={formatClock(slot)}
                  style={[styles.row, on && styles.rowOn]}
                >
                  <Text style={[styles.rowText, on && styles.rowTextOn]}>{formatClock(slot)}</Text>
                  {on && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
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
  card: { backgroundColor: colors.paper, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '80%' },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: spacing.md, textAlign: 'center' },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: spacing.sm },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  rowOn: { backgroundColor: colors.tomatoWash },
  rowText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
  rowTextOn: { fontFamily: fonts.bodyBold, color: colors.tomatoDeep },
  check: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.tomato },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  clearBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  clearText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft },
  doneBtn: { backgroundColor: colors.tomato, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#FFFFFF' },
});
