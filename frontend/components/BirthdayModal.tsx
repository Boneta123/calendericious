import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { isValidUsZip, sanitizeZipInput } from '../utils/zip';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  currentZip: string;
  onClose: () => void;
  onSave: (zip: string) => void;
}

export function ZipModal({ visible, currentZip, onClose, onSave }: Props) {
  const [zip, setZip] = useState(currentZip);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!isValidUsZip(zip)) {
      setError('Enter a valid 5-digit US ZIP code.');
      return;
    }
    setError(null);
    onSave(zip);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Change your ZIP</Text>
          <Text style={styles.sub}>
            We use your ZIP to find deals at chains with a branch near you.
          </Text>

          <TextField
            label="US ZIP code"
            value={zip}
            onChangeText={(t) => {
              setZip(sanitizeZipInput(t));
              if (error) setError(null);
            }}
            placeholder="10001"
            keyboardType="number-pad"
            maxLength={5}
            error={error}
            mono
          />

          <PrimaryButton label="Save ZIP" onPress={handleSave} />
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
