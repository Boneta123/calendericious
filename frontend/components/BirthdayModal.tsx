import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { BirthdayPicker } from './BirthdayPicker';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  currentBirthday: string; // stored "MM-DD" (or "")
  onClose: () => void;
  onSave: (birthday: string) => void; // receives stored "MM-DD"
}

export function BirthdayModal({ visible, currentBirthday, onClose, onSave }: Props) {
  // Stored "MM-DD" (or ""). The picker only emits valid values.
  const [birthday, setBirthday] = useState(currentBirthday);
  const [error, setError] = useState<string | null>(null);

  // Re-sync when reopened with a different saved birthday.
  useEffect(() => {
    if (visible) setBirthday(currentBirthday);
  }, [visible, currentBirthday]);

  const handleSave = () => {
    if (!birthday) {
      setError('Pick your birthday.');
      return;
    }
    setError(null);
    onSave(birthday);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Change your birthday</Text>
          <Text style={styles.sub}>
            We use your birthday to surface birthday deals during your special day, week, or month.
          </Text>

          <BirthdayPicker
            value={birthday}
            onChange={(v) => {
              setBirthday(v);
              if (error) setError(null);
            }}
            error={error ?? undefined}
          />

          <PrimaryButton label="Save birthday" onPress={handleSave} />
          <PrimaryButton label="Cancel" variant="ghost" onPress={onClose} style={{ marginTop: spacing.sm }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
});
