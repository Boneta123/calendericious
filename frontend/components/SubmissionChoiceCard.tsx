import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { FadeInView } from './FadeInView';

/**
 * Vibrant submission choice card: entrance (BlurFade-style via FadeInView),
 * a tactile press-scale spring, and a slow diagonal light "sheen" sweep
 * (native take on MagicUI's animated-shiny-text / shimmer-button).
 */
export function SubmissionChoiceCard({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
}: {
  icon: ImageSourcePropType;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sheen]);

  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-240, 240] });
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }).start();

  return (
    <FadeInView delay={delay}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Animated.View style={[styles.card, shadow.soft, { transform: [{ scale }] }]}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
          <Animated.View
            pointerEvents="none"
            style={[styles.sheen, { transform: [{ translateX: sheenX }, { rotate: '18deg' }] }]}
          />
        </Animated.View>
      </Pressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: { width: 120, height: 120, marginBottom: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  sheen: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
