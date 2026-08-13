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
import { useAuth } from '../../context/AuthContext';
import { useFoodVendors } from '../../context/FoodVendorContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { formatBirthday } from '../../utils/birthday';
import { toDateKey } from '../../utils/date';

export default function CalendarHome() {
  const { user, updateBirthday } = useAuth();
  const { foodVendorMode, toggleFoodVendorMode } = useFoodVendors();
  const [birthdayModal, setBirthdayModal] = useState(false);

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
  vendorToggle: {
    alignSelf: 'center',
    backgroundColor: colors.tomatoWash,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.tomatoWash,
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
