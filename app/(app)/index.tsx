import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/BrandLogo';
import { CalendarGrid } from '../../components/CalendarGrid';
import { FoodScatter } from '../../components/FoodScatter';
import { ZipModal } from '../../components/ZipModal';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { toDateKey } from '../../utils/date';

export default function CalendarHome() {
  const { user, updateZip } = useAuth();
  const [zipModal, setZipModal] = useState(false);

  const openDay = (date: Date) => router.push(`/(app)/day/${toDateKey(date)}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FoodScatter />
      <View style={styles.content}>
        <BrandLogo width={150} style={{ marginBottom: spacing.md }} />
        {/* Greeting + ZIP chip */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hey {user?.displayName} 👋</Text>
            <Text style={styles.tagline}>What's on the menu these two weeks?</Text>
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

        <Text style={styles.rangeLabel}>This week & next</Text>

        <CalendarGrid onSelectDay={openDay} />

        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Days with deals · tap any day to dig in</Text>
        </View>
      </View>

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
  },
  avatarText: { fontFamily: fonts.display, fontSize: 20, color: '#FFFFFF' },
  zipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
});
