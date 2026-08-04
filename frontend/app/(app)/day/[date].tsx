import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coupon } from '../../../components/Coupon';
import { useAuth } from '../../../context/AuthContext';
import { ApiDeal, dealShowsOnDate, fetchDeals } from '../../../data/api';
import { colors, fonts, radii, spacing } from '../../../theme/theme';
import { formatLongDate, fromDateKey, MONTH_NAMES, WEEKDAY_FULL } from '../../../utils/date';

export default function DayDetail() {
  const { date: dateKey } = useLocalSearchParams<{ date: string }>();
  const { user } = useAuth();

  const date = useMemo(() => fromDateKey(dateKey ?? ''), [dateKey]);
  const [allDeals, setAllDeals] = useState<ApiDeal[]>([]);

  useEffect(() => {
    let active = true;
    fetchDeals(user?.id)
      .then((d) => active && setAllDeals(d))
      .catch(() => active && setAllDeals([]));
    return () => {
      active = false;
    };
  }, [user?.id]);

  const deals = useMemo(
    () => allDeals.filter((d) => dealShowsOnDate(d, date)),
    [allDeals, date],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekday}>{WEEKDAY_FULL[date.getDay()]}</Text>
          <Text style={styles.bigDate}>
            {MONTH_NAMES[date.getMonth()]} {date.getDate()}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countNum}>{deals.length}</Text>
          <Text style={styles.countLabel}>deals</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>
          🍴 {deals.length > 0 ? 'In time order' : 'Nothing cooking'}
        </Text>

        {deals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🥡</Text>
            <Text style={styles.emptyTitle}>No deals on {formatLongDate(date)}</Text>
            <Text style={styles.emptySub}>Try another day to scout more deals.</Text>
          </View>
        ) : (
          deals.map((item) => <Coupon key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginTop: -4 },
  weekday: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: colors.tomato,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bigDate: { fontFamily: fonts.display, fontSize: 30, color: colors.ink, marginTop: -2 },
  countPill: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 58,
  },
  countNum: { fontFamily: fonts.display, fontSize: 22, color: colors.mustard },
  countLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.lg,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 52, marginBottom: spacing.md },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
    paddingHorizontal: spacing.xl,
  },
});
