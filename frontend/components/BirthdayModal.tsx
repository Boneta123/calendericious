import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { isValidBirthday, sanitizeBirthdayInput, toStoredBirthday } from '../utils/birthday';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  currentBirthday: string; // stored "MM-DD" (or "")
  onClose: () => void;
  onSave: (birthday: string) => void; // receives stored "MM-DD"
}

export function BirthdayModal({ visible, currentBirthday, onClose, onSave }: Props) {
  const [birthday, setBirthday] = useState(() =>
    currentBirthday ? currentBirthday.replace('-', '/') : '',
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!isValidBirthday(birthday)) {
      setError('Enter your birthday as MM/DD.');
      return;
    }
    setError(null);
    onSave(toStoredBirthday(birthday));
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

          <TextField
            label="Birthday (MM/DD)"
            value={birthday}
            onChangeText={(t) => {
              setBirthday(sanitizeBirthdayInput(t));
              if (error) setError(null);
            }}
            placeholder="07/04"
            keyboardType="number-pad"
            maxLength={5}
            error={error}
            mono
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
