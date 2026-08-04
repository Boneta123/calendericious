import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RestaurantPickerModal } from '../../components/RestaurantPickerModal';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { useRestaurantSelection } from '../../context/RestaurantSelectionContext';
import { saveRestaurants } from '../../data/api';
import { pickRandom } from '../../data/restaurants';
import { colors, fonts, spacing } from '../../theme/theme';
import { isValidUsZip, sanitizeZipInput } from '../../utils/zip';

export default function SignUp() {
  const { signUp, user } = useAuth();
  const { selectedIds } = useRestaurantSelection();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zip, setZip] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // After the account is created, gate entry behind picking ≥1 restaurant.
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recommendations] = useState(() => pickRandom(3));

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = 'Pick a name to show on your deals.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length <= 7 || !/[^A-Za-z0-9]/.test(password))
      next.password = 'Must be more than 7 characters and include a special character.';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    if (!isValidUsZip(zip)) next.zip = 'Enter a valid 5-digit US ZIP code.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Create the account; only show onboarding once the server confirms it.
    setSubmitting(true);
    try {
      await signUp({ email, password, displayName: displayName.trim(), zip });
      setShowOnboarding(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      // Surface a duplicate-email conflict under the Email field.
      if (/email/i.test(msg) && /(already|registered|use|taken|exist)/i.test(msg)) {
        setErrors({ email: 'This email is already in use.' });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    // Best-effort persist of the chosen restaurants, then enter the app.
    if (user) {
      try {
        await saveRestaurants(user.id, [...selectedIds]);
      } catch {
        // non-blocking — the selection is also kept in memory for this session
      }
    }
    setShowOnboarding(false);
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <BrandLogo width={300} />
            <Text style={styles.title}>Claim a seat at the table.</Text>
            <Text style={styles.sub}>
              Create an account and we'll surface the tastiest deals near your ZIP.
            </Text>
          </View>

          <TextField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Hungry Sam"
            autoCapitalize="words"
            error={errors.displayName}
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            error={errors.email}
            helper="Must not already be in use."
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            passwordToggle
            error={errors.password}
            helper="More than 7 characters and at least one special character (!@#$…)."
          />
          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            passwordToggle
            error={errors.confirmPassword}
          />
          <TextField
            label="US ZIP code"
            value={zip}
            onChangeText={(t) => setZip(sanitizeZipInput(t))}
            placeholder="10001"
            keyboardType="number-pad"
            maxLength={5}
            error={errors.zip}
            mono
          />

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <PrimaryButton
            label={submitting ? 'Creating…' : 'Create account'}
            onPress={handleSubmit}
            disabled={submitting}
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RestaurantPickerModal
        visible={showOnboarding}
        mode="onboarding"
        recommended={recommendations}
        onContinue={handleContinue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  header: { alignItems: 'center', marginTop: -spacing.lg, marginBottom: spacing.xl },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    lineHeight: 36,
    paddingTop: 2,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  formError: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.tomato,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.inkSoft },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.tomato },
});
