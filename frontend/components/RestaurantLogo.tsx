import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/theme';

/** Minimal shape this component needs — satisfied by both the picker's
 *  `Restaurant` and the API deal's joined `restaurant` ({ name, logoUrl }). */
type LogoSource = { name: string; logoUrl: string };

// Deterministic warm accent per restaurant so the letter fallback still looks
// on-brand (no emoji). Picks from the app's palette by name hash.
const FALLBACK_TINTS = [colors.tomato, colors.mustard, colors.basil, colors.grape];
function tintFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_TINTS[h % FALLBACK_TINTS.length];
}

/**
 * Brand logo pulled from Google's favicon service. On load failure (or slow
 * network) it falls back to the restaurant's initial on a warm tint — never
 * an emoji.
 */
export function RestaurantLogo({
  restaurant,
  size = 44,
}: {
  restaurant: LogoSource;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const radius = radii.md;

  if (failed) {
    return (
      <View
        style={[
          styles.base,
          { width: size, height: size, borderRadius: radius, backgroundColor: tintFor(restaurant.name) },
        ]}
      >
        <Text style={[styles.letter, { fontSize: size * 0.44 }]}>
          {restaurant.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.base, styles.imageWrap, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={{ uri: restaurant.logoUrl }}
        resizeMode="contain"
        onError={() => setFailed(true)}
        accessible={false}
        style={{ width: size * 0.72, height: size * 0.72 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  imageWrap: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line },
  letter: { fontFamily: fonts.display, color: '#FFFFFF' },
});
