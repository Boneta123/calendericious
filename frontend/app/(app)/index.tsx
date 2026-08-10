import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/BrandLogo';
import { CalendarGrid } from '../../components/CalendarGrid';
import { FoodScatter } from '../../components/FoodScatter';
import { BirthdayModal } from '../../components/BirthdayModal';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { formatBirthday } from '../../utils/birthday';
import { toDateKey } from '../../utils/date';

export default function CalendarHome() {
  const { user, updateBirthday } = useAuth();
  const [birthdayModal, setBirthdayModal] = useState(false);

  const openDay = (date: Date) => router.push(`/(app)/day/${toDateKey(date)}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FoodScatter />
      <View style={styles.content}>
        <BrandLogo width={150} style={{ marginBottom: spacing.md }} />
        {/* Greeting + birthday chip */}
        <View style={styles.topRow}>
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
        </View>

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

        <CalendarGrid onSelectDay={openDay} />

        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Days with deals · tap any day to dig in</Text>
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
  legendText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
