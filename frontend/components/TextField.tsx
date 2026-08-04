import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  mono?: boolean;
  /** Show a Show/Hide toggle for password fields. */
  passwordToggle?: boolean;
  /** Persistent hint shown below the input when there's no error. */
  helper?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  maxLength,
  mono = false,
  passwordToggle = false,
  helper,
}: Props) {
  const [hidden, setHidden] = useState(true);
  // When the toggle is on, this field controls its own masking.
  const isSecure = passwordToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={[
            styles.input,
            mono && styles.mono,
            passwordToggle && styles.inputWithToggle,
            !!error && styles.inputError,
          ]}
        />
        {passwordToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
          >
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputRow: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    height: 54,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  inputWithToggle: { paddingRight: 72 },
  mono: { fontFamily: fonts.monoBold, letterSpacing: 2, fontSize: 18 },
  inputError: { borderColor: colors.tomato },
  helper: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  toggle: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.tomatoDeep,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
