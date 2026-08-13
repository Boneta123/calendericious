import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RestaurantPickerModal } from '../../components/RestaurantPickerModal';
import { FoodVendorPickerModal } from '../../components/FoodVendorPickerModal';
import { BirthdayModal } from '../../components/BirthdayModal';
import { useAuth } from '../../context/AuthContext';
import { useRestaurantSelection } from '../../context/RestaurantSelectionContext';
import { useFoodVendors } from '../../context/FoodVendorContext';
import { saveProfilePhoto, saveRestaurants } from '../../data/api';
import { colors, fonts, radii, shadow, spacing } from '../../theme/theme';
import { formatBirthday } from '../../utils/birthday';

/**
 * Profile / settings. Working parts: identity summary, change birthday, log out.
 * The rows marked below are placeholders whose behavior arrives with the
 * backend (notifications, favorite chains, account management).
 */
export default function Profile() {
  const { user, updateBirthday, updatePhoto, logOut } = useAuth();
  const { count: restaurantCount, selectedIds } = useRestaurantSelection();
  const { count: vendorCount } = useFoodVendors();
  const [birthdayModal, setBirthdayModal] = useState(false);
  const [restaurantModal, setRestaurantModal] = useState(false);
  const [vendorModal, setVendorModal] = useState(false);
  // Hydrate from the saved photo (a compressed base64 data URI returned at login).
  const [photoUri, setPhotoUri] = useState<string | null>(user?.profilePhoto ?? null);

  // Device location — shown so the user can confirm what their device reports.
  const [locStatus, setLocStatus] = useState<'loading' | 'denied' | 'error' | 'ok'>('loading');
  const [locText, setLocText] = useState('');
  const loadLocation = useCallback(async () => {
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      let text = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        const g = geo[0];
        const parts = [g?.name, g?.city ?? g?.subregion, g?.region, g?.postalCode].filter(Boolean);
        if (parts.length) text = parts.join(', ');
      } catch {
        /* reverse geocode unavailable — keep the coordinates */
      }
      setLocText(text);
      setLocStatus('ok');
    } catch {
      setLocStatus('error');
    }
  }, []);
  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    // Compress + resize to ~256px JPEG so the stored base64 stays small.
    const shrunk = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 256, height: 256 } }],
      { compress: 0.5, format: SaveFormat.JPEG, base64: true },
    );
    const dataUri = `data:image/jpeg;base64,${shrunk.base64}`;
    setPhotoUri(dataUri); // show immediately

    // Persist to the DB (base64 in User.profilePhoto). Keep the local preview
    // even if the save fails.
    if (user) {
      try {
        await saveProfilePhoto(user.id, dataUri);
        updatePhoto(dataUri); // keep it in session state
      } catch {
        /* non-blocking — preview stays for this session */
      }
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
                  {user?.displayName?.[0]?.toUpperCase() ?? ''}
                </Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>+</Text>
            </View>
          </Pressable>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionLabel}>Birthday</Text>
        <Pressable onPress={() => setBirthdayModal(true)} style={[styles.row, shadow.soft]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Birthday</Text>
            <Text style={styles.rowSub}>
              {user?.birthday ? `Your birthday ${formatBirthday(user.birthday)}` : 'Not set'}
            </Text>
          </View>
          <Text style={styles.rowAction}>Change</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Your location</Text>
        <Pressable onPress={loadLocation} style={[styles.row, shadow.soft]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Device location</Text>
            <Text style={styles.rowSub}>
              {locStatus === 'loading'
                ? 'Locating…'
                : locStatus === 'denied'
                  ? 'Location permission is off — enable it in Settings.'
                  : locStatus === 'error'
                    ? "Couldn't get your location. Tap to retry."
                    : locText}
            </Text>
          </View>
          <Text style={styles.rowAction}>Refresh</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Your restaurants</Text>
        <Pressable onPress={() => setRestaurantModal(true)} style={[styles.row, shadow.soft]}>
          <View style={styles.countMark}>
            <Text style={styles.countMarkText}>{restaurantCount}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Choose your restaurants</Text>
            <Text style={styles.rowSub}>
              {restaurantCount === 0
                ? 'Pick the spots you want deals from'
                : `${restaurantCount} selected`}
            </Text>
          </View>
          <Text style={styles.rowAction}>Edit</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Food vendors</Text>
        <Pressable onPress={() => setVendorModal(true)} style={[styles.row, shadow.soft]}>
          <View style={styles.countMark}>
            <Text style={styles.countMarkText}>{vendorCount}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Choose food vendors</Text>
            <Text style={styles.rowSub}>
              {vendorCount === 0
                ? 'Convenience stores & grocers — deals in the food-vendor view'
                : `${vendorCount} selected`}
            </Text>
          </View>
          <Text style={styles.rowAction}>Edit</Text>
        </Pressable>

        <PrimaryButton
          label="Log out"
          variant="ghost"
          onPress={handleLogout}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      <BirthdayModal
        visible={birthdayModal}
        currentBirthday={user?.birthday ?? ''}
        onClose={() => setBirthdayModal(false)}
        onSave={updateBirthday}
      />

      <RestaurantPickerModal
        visible={restaurantModal}
        onClose={() => {
          setRestaurantModal(false);
          // Persist the updated selection (best-effort; also kept in memory).
          if (user) saveRestaurants(user.id, [...selectedIds]).catch(() => {});
        }}
      />

      <FoodVendorPickerModal visible={vendorModal} onClose={() => setVendorModal(false)} />
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
  countMark: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countMarkText: { fontFamily: fonts.display, fontSize: 16, color: '#FFFFFF' },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  rowSub: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  rowAction: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.tomato,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
