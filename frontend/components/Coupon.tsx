import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResolvedDeal } from '../data/types';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { Badge } from './Badge';
import { TimeWindowBar } from './TimeWindowBar';

/**
 * The signature element: a deal rendered as a tear-off coupon.
 * Brand-tinted top, a dashed perforation with notched edges, and a stub
 * that carries the time window + a Rewards badge when required.
 */
export function Coupon({ item }: { item: ResolvedDeal }) {
  const { deal, chain, branch } = item;
  const allDay = deal.startTime === null;

  return (
    <View style={[styles.card, shadow.card]}>
      {/* Brand accent stripe */}
      <View style={[styles.stripe, { backgroundColor: chain.accent }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.emojiChip, { backgroundColor: chain.accent + '22' }]}>
            <Text style={styles.emoji}>{chain.emoji}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.chain}>{chain.name}</Text>
            <Text style={styles.branch} numberOfLines={1}>
              📍 {branch.name} · {branch.distanceMiles} mi
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{deal.title}</Text>
        <Text style={styles.desc}>{deal.description}</Text>

        <View style={styles.badgeRow}>
          <Badge label={allDay ? 'All day' : 'Timed deal'} tone={allDay ? 'basil' : 'mustard'} />
          {deal.requiresRewards && <Badge label="★ Rewards required" tone="grape" />}
        </View>
      </View>

      {/* Perforation: dashed line with two paper-colored notches */}
      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={styles.dashes} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>

      {/* Stub */}
      <View style={styles.stub}>
        <TimeWindowBar startTime={deal.startTime} endTime={deal.endTime} />
      </View>
    </View>
  );
}

const NOTCH = 22;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  stripe: {
    height: 8,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  body: { padding: spacing.xl, paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: { fontSize: 26 },
  headerText: { flex: 1 },
  chain: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  branch: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 30,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },

  perforation: { height: NOTCH, justifyContent: 'center' },
  dashes: {
    marginHorizontal: NOTCH / 2,
    borderBottomWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.paper,
    top: 0,
  },
  notchLeft: { left: -NOTCH / 2 },
  notchRight: { right: -NOTCH / 2 },

  stub: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.sm },
});
