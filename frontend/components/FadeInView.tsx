import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

/**
 * Blur-fade-style entrance (opacity + small upward translate, ease-out) — the
 * native equivalent of MagicUI's BlurFade (RN can't cheaply blur, so we drop
 * the blur and keep the fade+rise). Use `delay` to stagger a group.
 */
export function FadeInView({
  children,
  delay = 0,
  offsetY = 12,
  duration = 400,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  offsetY?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [p, delay, duration]);

  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] });
  return (
    <Animated.View style={[style, { opacity: p, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
