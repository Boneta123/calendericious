import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { CHARACTERS } from '../assets/foodCharacters';
import { shadow } from '../theme/theme';

/**
 * Decorative layer of food characters that peek from the screen edges and
 * bob/tilt on a slow loop (claymorphism "floating blobs" feel).
 *
 * Rendered absolutely with pointerEvents="none" so it can NEVER intercept
 * taps meant for the form. Positions are biased to the margins so characters
 * frame the content instead of sitting under inputs. Fully hidden from
 * screen readers, and motion is disabled when Reduce Motion is on.
 */

// Edge-biased slots as fractions of screen width/height — one per character,
// framing the content without sitting over it. left/top are the character's
// top-left corner; sizes stay small so PNGs never dominate.
const SLOTS = [
  { left: -0.05, top: 0.05, size: 88, rot: -12, drift: 10, delay: 0 },
  { left: 0.76, top: 0.06, size: 96, rot: 10, drift: 14, delay: 400 },
  { left: 0.83, top: 0.42, size: 78, rot: 16, drift: 9, delay: 900 },
  { left: -0.07, top: 0.45, size: 84, rot: -8, drift: 12, delay: 1300 },
  { left: 0.74, top: 0.82, size: 90, rot: -14, drift: 11, delay: 700 },
  { left: -0.05, top: 0.85, size: 86, rot: 12, drift: 13, delay: 1600 },
] as const;

function FloatingCharacter({
  source,
  x,
  y,
  size,
  rot,
  drift,
  delay,
  animate,
}: {
  source: ImageSourcePropType;
  x: number;
  y: number;
  size: number;
  rot: number;
  drift: number;
  delay: number;
  animate: boolean;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 2600,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, delay, t]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -drift] });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rot}deg`, `${rot + (rot >= 0 ? 4 : -4)}deg`],
  });

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.character,
        shadow.soft,
        { left: x, top: y, width: size, height: size, opacity: 0.9, transform: [{ translateY }, { rotate }] },
      ]}
    />
  );
}

export function FoodScatter({ count = SLOTS.length }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (mounted) setAnimate(!reduced);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) =>
      setAnimate(!reduced),
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const slots = SLOTS.slice(0, count);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      {slots.map((slot, i) => (
        <FloatingCharacter
          key={i}
          source={CHARACTERS[i]}
          x={slot.left * width}
          y={slot.top * height}
          size={slot.size}
          rot={slot.rot}
          drift={slot.drift}
          delay={slot.delay}
          animate={animate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  character: { position: 'absolute' },
});
