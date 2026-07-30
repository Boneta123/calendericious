import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ZipModal } from '../../components/ZipModal';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';

/**
 * Profile / settings. Working parts: identity summary, change ZIP, log out.
 * The rows marked below are placeholders whose behavior arrives with the
 * backend (notifications, favorite chains, account management).
 */
export default function Profile() {
  const { user, updateZip, logOut } = useAuth();
  const [zipModal, setZipModal] = useState(false);
  // Local only — the chosen photo is kept in memory for this session. No
  // backend/persistence yet; it resets when the app restarts.
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    logOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.identity, shadow.soft]}>
          <Pressable
            onPress={pickPhoto}
            style={styles.avatarPress}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <View style={styles.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.displayName?.[0]?.toUpperCase() ?? '🙂'}
                </Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </Pressable>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionLabel}>Location</Text>
        <Pressable onPress={() => setZipModal(true)} style={[styles.row, shadow.soft]}>
          <Text style={styles.rowIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>ZIP code</Text>
            <Text style={styles.rowSub}>Deals near {user?.zip}</Text>
          </View>
          <Text style={styles.rowAction}>Change</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Coming soon</Text>
        {/* TODO: backend — these rows are placeholders until the API exists. */}
        <PlaceholderRow icon="🔔" title="Deal notifications" />
        <PlaceholderRow icon="⭐" title="Favorite chains" />
        <PlaceholderRow icon="🎟️" title="My rewards accounts" />

        <PrimaryButton
          label="Log out"
          variant="ghost"
          onPress={handleLogout}
          style={{ marginTop: spacing.xl }}
        />
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

function PlaceholderRow({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={[styles.row, styles.rowDisabled]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowTitle, { flex: 1 }]}>{title}</Text>
      <Text style={styles.soon}>Soon</Text>
    </View>
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
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  identity: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    padding: spacing.xxl,
    marginBottom: spacing.xl,
  },
  avatarPress: { marginBottom: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 72, height: 72 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.mustard,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 13 },
  avatarText: { fontFamily: fonts.display, fontSize: 32, color: '#FFFFFF' },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  email: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowDisabled: { opacity: 0.6 },
  rowIcon: { fontSize: 20 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  rowSub: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  rowAction: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soon: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
});
