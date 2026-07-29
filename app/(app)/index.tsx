import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarGrid } from '../../components/CalendarGrid';
import { ZipModal } from '../../components/ZipModal';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { MONTH_NAMES, toDateKey } from '../../utils/date';

export default function CalendarHome() {
  const { user, updateZip } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());
  const [zipModal, setZipModal] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const shiftMonth = (delta: number) =>
    setCursor(new Date(year, month + delta, 1));

  const openDay = (date: Date) => router.push(`/(app)/day/${toDateKey(date)}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting + ZIP chip */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hey {user?.displayName} 👋</Text>
            <Text style={styles.tagline}>What's on the menu this month?</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={styles.avatar}
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>
              {user?.displayName?.[0]?.toUpperCase() ?? '🙂'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setZipModal(true)}
          style={[styles.zipChip, shadow.soft]}
          accessibilityLabel="Change ZIP code"
        >
          <Text style={styles.zipPin}>📍</Text>
          <Text style={styles.zipText}>Deals near {user?.zip}</Text>
          <Text style={styles.zipChange}>Change</Text>
        </Pressable>

        {/* Month switcher */}
        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.arrow} accessibilityLabel="Previous month">
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.arrow} accessibilityLabel="Next month">
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        <CalendarGrid year={year} month={month} onSelectDay={openDay} />

        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Days with deals · tap any day to dig in</Text>
        </View>
      </ScrollView>

      <ZipModal
        visible={zipModal}
        currentZip={user?.zip ?? ''}
        onClose={() => setZipModal(false)}
        onSave={updateZip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
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
  },
  avatarText: { fontFamily: fonts.display, fontSize: 20, color: '#FFFFFF' },
  zipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  zipPin: { fontSize: 16, marginRight: spacing.sm },
  zipText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  zipChange: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginTop: -2 },
  monthLabel: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, justifyContent: 'center' },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mustard,
    marginRight: spacing.sm,
  },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft },
});
