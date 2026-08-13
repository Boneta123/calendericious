import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiDeal, dealVendor, dislikeDeal, likeDeal } from '../data/api';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { Badge } from './Badge';
import { RestaurantLogo } from './RestaurantLogo';
import { TimeWindowBar } from './TimeWindowBar';

/**
 * The signature element: a deal rendered as a tear-off coupon.
 * Brand-tinted top, a dashed perforation with notched edges, and a stub
 * that carries the time window + a Rewards badge when required. Works for a
 * restaurant OR food-vendor deal (see `dealVendor`).
 */
export function Coupon({ item }: { item: ApiDeal }) {
  const vendor = dealVendor(item);
  const allDay = item.startTime === null;

  // Like/dislike — optimistic; one vote per mounted card.
  const [likes, setLikes] = useState(item.likes);
  const [dislikes, setDislikes] = useState(item.dislikes);
  const [voted, setVoted] = useState<null | 'like' | 'dislike'>(null);

  const like = () => {
    if (voted) return;
    setVoted('like');
    setLikes((n) => n + 1);
    likeDeal(item.id)
      .then((r) => {
        setLikes(r.likes);
        setDislikes(r.dislikes);
      })
      .catch(() => {
        setVoted(null);
        setLikes((n) => n - 1);
      });
  };
  const dislike = () => {
    if (voted) return;
    setVoted('dislike');
    setDislikes((n) => n + 1);
    dislikeDeal(item.id)
      .then((r) => {
        setLikes(r.likes);
        setDislikes(r.dislikes);
      })
      .catch(() => {
        setVoted(null);
        setDislikes((n) => n - 1);
      });
  };

  return (
    <View style={[styles.card, shadow.card]}>
      {/* Brand accent stripe (the API has no per-brand color, so a theme accent). */}
      <View style={[styles.stripe, { backgroundColor: colors.tomato }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.logoChip}>
            <RestaurantLogo restaurant={vendor} size={48} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.chain}>{vendor.name}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.badgeRow}>
          <Badge label={allDay ? 'All day' : 'Timed deal'} tone={allDay ? 'basil' : 'mustard'} />
          {item.onlineOrderOnly && <Badge label="Online only" tone="basil" />}
          {item.requiresRewards && <Badge label="Rewards required" tone="grape" />}
        </View>

        {/* Like / dislike */}
        <View style={styles.voteRow}>
          <Pressable
            onPress={like}
            disabled={!!voted}
            style={[styles.voteBtn, voted === 'like' && styles.voteBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={`Like this deal (${likes})`}
          >
            <Text style={[styles.voteText, voted === 'like' && styles.voteTextActive]}>Like · {likes}</Text>
          </Pressable>
          <Pressable
            onPress={dislike}
            disabled={!!voted}
            style={[styles.voteBtn, voted === 'dislike' && styles.voteBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={`Dislike this deal (${dislikes})`}
          >
            <Text style={[styles.voteText, voted === 'dislike' && styles.voteTextActive]}>
              Dislike · {dislikes}
            </Text>
          </Pressable>
        </View>

        {item.foundByUserId && (
          <Pressable
            onPress={() => router.push(`/(app)/user/${item.foundByUserId}`)}
            style={styles.foundByLink}
            accessibilityRole="button"
            accessibilityLabel={`View profile of ${item.foundBy ?? 'the member'} who added this deal`}
          >
            <Text style={styles.foundByText}>Added by {item.foundBy ?? 'a member'} ›</Text>
          </Pressable>
        )}

        {item.sourceUrl && (
          <Pressable
            onPress={() => Linking.openURL(item.sourceUrl!)}
            style={styles.sourceLink}
            accessibilityRole="link"
            accessibilityLabel={`View this deal on ${vendor.name}'s website`}
          >
            <Text style={styles.sourceText}>View source ↗</Text>
          </Pressable>
        )}
      </View>

      {/* Perforation: dashed line with two paper-colored notches */}
      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={styles.dashes} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>

      {/* Stub */}
      <View style={styles.stub}>
        <TimeWindowBar startTime={item.startTime} endTime={item.endTime} />
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
  logoChip: { marginRight: spacing.md },
  headerText: { flex: 1 },
  chain: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
  voteRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  voteBtn: {
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.line,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  voteBtnActive: { backgroundColor: colors.tomato, borderColor: colors.tomato },
  voteText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  voteTextActive: { color: '#FFFFFF' },
  foundByLink: { marginTop: spacing.md, alignSelf: 'flex-start' },
  foundByText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.tomato },
  sourceLink: { marginTop: spacing.md, alignSelf: 'flex-start' },
  sourceText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.grape,
    textDecorationLine: 'underline',
  },

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
