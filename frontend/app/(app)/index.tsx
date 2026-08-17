import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/BrandLogo';
import { CalendarGrid } from '../../components/CalendarGrid';
import { FoodScatter } from '../../components/FoodScatter';
import { FadeInView } from '../../components/FadeInView';
import { TopNav } from '../../components/TopNav';
import { BirthdayModal } from '../../components/BirthdayModal';
import { HowItWorksModal } from '../../components/HowItWorksModal';
import { useAuth } from '../../context/AuthContext';
import { useFoodVendors } from '../../context/FoodVendorContext';
import { NEAR_ME_RADIUS_OPTIONS, useNearMe } from '../../context/NearMeContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { formatBirthday } from '../../utils/birthday';
import { toDateKey } from '../../utils/date';

export default function CalendarHome() {
  const { user, updateBirthday } = useAuth();
  const { foodVendorMode, toggleFoodVendorMode } = useFoodVendors();
  const { nearMe, toggleNearMe, radiusMi, setRadiusMi } = useNearMe();
  const [birthdayModal, setBirthdayModal] = useState(false);
  const [howItWorks, setHowItWorks] = useState(false);

  const openDay = (date: Date) => router.push(`/(app)/day/${toDateKey(date)}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FoodScatter />
      <View style={styles.content}>
        <TopNav />
        <BrandLogo width={150} style={{ marginBottom: spacing.md }} />
        {/* Greeting + birthday chip */}
        <FadeInView delay={40} style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hey {user?.displayName}</Text>
            <Text style={styles.tagline}>What's on the menu this month?</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={styles.avatar}
            accessibilityLabel="Open profile"
          >
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.displayName?.[0]?.toUpperCase() ?? ''}
              </Text>
            )}
          </Pressable>
        </FadeInView>

        <Pressable
          onPress={() => setBirthdayModal(true)}
          style={[styles.birthdayChip, shadow.soft]}
          accessibilityLabel="Change your birthday"
        >
          <Text style={styles.birthdayText}>
            {user?.birthday ? `Birthday ${formatBirthday(user.birthday)}` : 'Add your birthday'}
          </Text>
          <Text style={styles.birthdayChange}>Change</Text>
        </Pressable>

        <View style={styles.toggleRow}>
          <Pressable
            onPress={toggleFoodVendorMode}
            style={[styles.vendorToggle, foodVendorMode && styles.vendorToggleOn, shadow.soft]}
            accessibilityRole="button"
            accessibilityState={{ selected: foodVendorMode }}
            accessibilityLabel={foodVendorMode ? 'Hide food vendors, show restaurants' : 'Show food vendors'}
          >
            <Text style={[styles.vendorToggleText, foodVendorMode && styles.vendorToggleTextOn]}>
              {foodVendorMode ? 'Hide food vendors' : 'Show food vendors'}
            </Text>
          </Pressable>
          <Pressable
            onPress={toggleNearMe}
            style={[styles.vendorToggle, nearMe && styles.vendorToggleOn, shadow.soft]}
            accessibilityRole="button"
            accessibilityState={{ selected: nearMe }}
            accessibilityLabel={nearMe ? 'Hide nearby places' : 'Show nearby places'}
          >
            <Text style={[styles.vendorToggleText, nearMe && styles.vendorToggleTextOn]}>
              Near me
            </Text>
          </Pressable>
        </View>

        {nearMe && (
          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>Within</Text>
            {NEAR_ME_RADIUS_OPTIONS.map((mi) => {
              const on = radiusMi === mi;
              return (
                <Pressable
                  key={mi}
                  onPress={() => setRadiusMi(mi)}
                  style={[styles.radiusPill, on && styles.radiusPillOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${mi} miles`}
                >
                  <Text style={[styles.radiusPillText, on && styles.radiusPillTextOn]}>{mi} mi</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={() => setHowItWorks(true)}
          style={styles.howLink}
          accessibilityRole="button"
          accessibilityLabel="How it works"
        >
          <Text style={styles.howLinkText}>How it works</Text>
        </Pressable>

        <CalendarGrid onSelectDay={openDay} />

        <View style={styles.legend}>
          <View style={[styles.legendDot, foodVendorMode && styles.legendDotVendor]} />
          <Text style={styles.legendText}>
            {foodVendorMode
              ? 'Days with food-vendor deals · tap any day to dig in'
              : 'Days with deals · tap any day to dig in'}
          </Text>
        </View>

        <Text style={styles.footnote}>
          {new Date().getFullYear()} is as far ahead as the calendar goes.
        </Text>
      </View>

      <BirthdayModal
        visible={birthdayModal}
        currentBirthday={user?.birthday ?? ''}
        onClose={() => setBirthdayModal(false)}
        onSave={updateBirthday}
      />

      <HowItWorksModal visible={howItWorks} onClose={() => setHowItWorks(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, paddingBottom: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  hello: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 20, color: '#FFFFFF' },
  avatarImage: { width: 46, height: 46 },
  birthdayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  birthdayText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  birthdayChange: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  vendorToggle: {
    backgroundColor: colors.tomatoWash,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.tomatoWash,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  radiusLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft },
  radiusPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  radiusPillOn: { borderColor: colors.tomato, backgroundColor: colors.tomatoWash },
  radiusPillText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  radiusPillTextOn: { color: colors.tomatoDeep },
  howLink: { alignSelf: 'center', marginBottom: spacing.md },
  howLinkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textDecorationLine: 'underline',
  },
  vendorToggleOn: { backgroundColor: colors.tomato, borderColor: colors.tomato },
  vendorToggleText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.tomatoDeep },
  vendorToggleTextOn: { color: '#FFFFFF' },
  rangeLabel: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mustard,
    marginRight: spacing.sm,
  },
  legendDotVendor: { backgroundColor: colors.tomato },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
