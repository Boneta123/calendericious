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
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, spacing } from '../../theme/theme';
import { isValidUsZip, sanitizeZipInput } from '../../utils/zip';

export default function SignUp() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zip, setZip] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = 'Pick a name to show on your deals.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Use at least 6 characters.';
    if (!isValidUsZip(zip)) next.zip = 'Enter a valid 5-digit US ZIP code.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    signUp({ email, password, displayName: displayName.trim(), zip });
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
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
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

          <PrimaryButton label="Create account" onPress={handleSubmit} style={{ marginTop: spacing.sm }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.inkSoft },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.tomato },
});
