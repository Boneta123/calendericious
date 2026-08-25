import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DISLIKE_ICON, LIKE_ICON } from '../assets/foodCharacters';
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
export function Coupon({ item, onDelete }: { item: ApiDeal; onDelete?: () => void }) {
  const vendor = dealVendor(item);
  const allDay = item.startTime === null;

  // Per-user reaction (one like OR dislike, persisted). Optimistic + server-synced.
  const [likes, setLikes] = useState(item.likes);
  const [dislikes, setDislikes] = useState(item.dislikes);
  const [reaction, setReaction] = useState<'LIKE' | 'DISLIKE' | null>(item.myReaction ?? null);
  const [busy, setBusy] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const dislikeScale = useRef(new Animated.Value(1)).current;

  // A slight bounce on the tapped icon: pop up, then spring back to rest.
  const bounce = (v: Animated.Value) => {
    Animated.sequence([
      Animated.timing(v, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
  };

  const react = (target: 'LIKE' | 'DISLIKE') => {
    if (busy) return;
    const prev = { likes, dislikes, reaction };
    // Optimistic toggle-exclusive (mirrors the backend).
    let nLikes = likes;
    let nDislikes = dislikes;
    let nReaction: 'LIKE' | 'DISLIKE' | null;
    if (reaction === target) {
      target === 'LIKE' ? (nLikes -= 1) : (nDislikes -= 1); // un-react
      nReaction = null;
    } else if (reaction) {
      // switch sides — remove the opposite, add this one
      target === 'LIKE' ? ((nLikes += 1), (nDislikes -= 1)) : ((nDislikes += 1), (nLikes -= 1));
      nReaction = target;
    } else {
      target === 'LIKE' ? (nLikes += 1) : (nDislikes += 1);
      nReaction = target;
    }
    setLikes(Math.max(0, nLikes));
    setDislikes(Math.max(0, nDislikes));
    setReaction(nReaction);
    bounce(target === 'LIKE' ? likeScale : dislikeScale);

    setBusy(true);
    (target === 'LIKE' ? likeDeal : dislikeDeal)(item.id)
      .then((r) => {
        setLikes(r.likes);
        setDislikes(r.dislikes);
        setReaction(r.myReaction);
      })
      .catch(() => {
        setLikes(prev.likes);
        setDislikes(prev.dislikes);
        setReaction(prev.reaction);
      })
      .finally(() => setBusy(false));
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
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={styles.deleteBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete this deal"
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.badgeRow}>
          <Badge label={allDay ? 'All day' : 'Timed deal'} tone={allDay ? 'basil' : 'mustard'} />
          {item.onlineOrderOnly && <Badge label="Online only" tone="basil" />}
          {item.requiresRewards && <Badge label="Rewards required" tone="grape" />}
        </View>

        {/* Like / dislike — PNG icons; selected = full opacity + bold count */}
        <View style={styles.voteRow}>
          <Pressable
            onPress={() => react('LIKE')}
            style={styles.voteBtn}
            accessibilityRole="button"
            accessibilityState={{ selected: reaction === 'LIKE' }}
            accessibilityLabel={`Like this deal (${likes})`}
          >
            <Animated.Image
              source={LIKE_ICON}
              resizeMode="contain"
              style={[styles.voteIcon, { transform: [{ scale: likeScale }], opacity: reaction === 'LIKE' ? 1 : 0.4 }]}
            />
            <Text style={[styles.voteCount, reaction === 'LIKE' && styles.voteCountActive]}>{likes}</Text>
          </Pressable>
          <Pressable
            onPress={() => react('DISLIKE')}
            style={styles.voteBtn}
            accessibilityRole="button"
            accessibilityState={{ selected: reaction === 'DISLIKE' }}
            accessibilityLabel={`Dislike this deal (${dislikes})`}
          >
            <Animated.Image
              source={DISLIKE_ICON}
              resizeMode="contain"
              style={[styles.voteIcon, { transform: [{ scale: dislikeScale }], opacity: reaction === 'DISLIKE' ? 1 : 0.4 }]}
            />
            <Text style={[styles.voteCount, reaction === 'DISLIKE' && styles.voteCountActive]}>{dislikes}</Text>
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
  deleteBtn: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.tomato,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  deleteBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  voteRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingRight: spacing.sm,
  },
  voteIcon: { width: 28, height: 28 },
  voteCount: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  voteCountActive: { color: colors.tomato },
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
