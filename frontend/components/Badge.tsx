import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';

type Tone = 'basil' | 'grape' | 'mustard' | 'tomato';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  basil: { bg: colors.basilWash, fg: colors.basil },
  grape: { bg: colors.grapeWash, fg: colors.grape },
  mustard: { bg: colors.mustardWash, fg: '#B77E00' },
  tomato: { bg: colors.tomatoWash, fg: colors.tomatoDeep },
};

export function Badge({ label, tone = 'tomato' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
