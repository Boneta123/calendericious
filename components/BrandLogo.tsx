import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, ImageStyle, StyleProp } from 'react-native';
import { BRAND_LOGO } from '../assets/foodCharacters';

/**
 * The Calendericious logo lockup. Animates in with a soft spring overshoot on
 * mount (skipped under Reduce Motion). Labeled as the brand for screen readers.
 */
export function BrandLogo({ width = 220, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  // Logo art is ~1.9:1 (wide) with the wordmark arched over the mascot.
  const height = width / 1.9;
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (!mounted) return;
      setReduced(r);
      if (r) {
        scale.setValue(1);
        opacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    });
    return () => {
      mounted = false;
    };
  }, [opacity, scale]);

  return (
    <Animated.Image
      source={BRAND_LOGO}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Calendericious"
      style={[
        { width, height, alignSelf: 'center', opacity: reduced ? 1 : opacity, transform: [{ scale }] },
        style,
      ]}
    />
  );
}
