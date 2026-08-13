import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coupon } from '../../../components/Coupon';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Spinner } from '../../../components/Spinner';
import { fetchUserProfile, PublicProfile } from '../../../data/api';
import { colors, fonts, radii, shadow, spacing } from '../../../theme/theme';

type Status = 'loading' | 'error' | 'success';

/**
 * Public profile of another user — the person who created a deal. Read-only:
 * shows their photo + name, how many deals they've created, and those deals
 * (with likes/dislikes). No email/birthday/settings (those stay private).
 */
export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(() => {
    if (!id) return;
    setStatus('loading');
    fetchUserProfile(id)
      .then((p) => {
        if (!mounted.current) return;
        setProfile(p);
        setStatus('success');
      })
      .catch(() => mounted.current && setStatus('error'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      {status === 'loading' ? (
        <View style={styles.stateBox}>
          <Spinner size={46} label="Loading profile…" />
        </View>
      ) : status === 'error' ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Couldn't load profile</Text>
          <PrimaryButton label="Try again" onPress={load} style={{ marginTop: spacing.lg }} />
        </View>
      ) : profile ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.identity, shadow.soft]}>
            <View style={styles.avatar}>
              {profile.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {profile.displayName?.[0]?.toUpperCase() ?? ''}
                </Text>
              )}
            </View>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.dealCount}>
              {profile.dealCount} {profile.dealCount === 1 ? 'deal' : 'deals'} created
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Their deals</Text>
          {profile.deals.length === 0 ? (
            <Text style={styles.empty}>{profile.displayName} hasn't posted any deals yet.</Text>
          ) : (
            profile.deals.map((d) => <Coupon key={d.id} item={d} />)
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
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
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  stateTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  identity: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  avatarImage: { width: 88, height: 88 },
  avatarText: { fontFamily: fonts.display, fontSize: 40, color: '#FFFFFF' },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  dealCount: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.inkSoft, marginTop: 2 },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.lg,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
