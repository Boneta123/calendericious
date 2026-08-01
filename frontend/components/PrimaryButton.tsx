import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'solid' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'solid',
  style,
}: Props) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        ghost ? styles.ghost : styles.solid,
        !ghost && !disabled && shadow.soft,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, ghost && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  solid: { backgroundColor: colors.tomato },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.line,
  },
  pressed: { transform: [{ scale: 0.98 }], backgroundColor: colors.tomatoDeep },
  disabled: { backgroundColor: colors.line },
  label: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ghostLabel: { color: colors.ink },
});
