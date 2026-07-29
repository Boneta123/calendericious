import React from 'react';
import {
  KeyboardTypeOptions,
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
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={[styles.input, mono && styles.mono, !!error && styles.inputError]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
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
  mono: { fontFamily: fonts.monoBold, letterSpacing: 2, fontSize: 18 },
  inputError: { borderColor: colors.tomato },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.tomatoDeep,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
