import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
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
  // Springy press-scale — a small, tactile "pop" shared by every button.
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    !disabled &&
    Animated.spring(scale, { toValue: 0.96, speed: 50, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.base,
          ghost ? styles.ghost : styles.solid,
          !ghost && !disabled && shadow.soft,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.label, ghost && styles.ghostLabel]}>{label}</Text>
      </Pressable>
    </Animated.View>
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
  pressed: { backgroundColor: colors.tomatoDeep },
  disabled: { backgroundColor: colors.line },
  label: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ghostLabel: { color: colors.ink },
});
