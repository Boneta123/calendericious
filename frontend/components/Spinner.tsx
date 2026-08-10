import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/theme';

/**
 * Orange-and-white two-tone ring spinner (native RN). The look mirrors a
 * MagicUI circular gauge — a white track with one orange arc — but built with
 * Animated (no web/SVG deps). Respects reduced motion (renders a static ring).
 */
export function Spinner({ size = 40, label }: { size?: number; label?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => mounted && setReduced(r));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (r) => setReduced(r));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const border = Math.max(3, Math.round(size * 0.12));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading'}
    >
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderWidth: border },
          !reduced && { transform: [{ rotate }] },
        ]}
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  ring: {
    borderColor: '#FFFFFF', // white track
    borderTopColor: colors.tomato, // orange arc
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft },
});
