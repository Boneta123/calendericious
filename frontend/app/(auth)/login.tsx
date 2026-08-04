import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FOOD_FRIENDS } from '../../assets/foodCharacters';
import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { useRestaurantSelection } from '../../context/RestaurantSelectionContext';
import { colors, fonts, spacing } from '../../theme/theme';

export default function LogIn() {
  const { logIn } = useAuth();
  const { setAll } = useRestaurantSelection();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 1) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const user = await logIn({ email, password });
      setAll(user.restaurantIds); // hydrate the saved selection
      router.replace('/(app)');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not log in.' });
    } finally {
      setSubmitting(false);
    }
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
            <Image
              source={FOOD_FRIENDS}
              resizeMode="contain"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={styles.friends}
            />
            <Text style={styles.title}>Welcome back, hungry.</Text>
            <Text style={styles.sub}>Log in to see today's deals near you.</Text>
          </View>

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
            passwordToggle
            error={errors.password}
          />

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <PrimaryButton
            label={submitting ? 'Logging in…' : 'Log in'}
            onPress={handleSubmit}
            disabled={submitting}
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/(auth)/signup" style={styles.footerLink}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.lg },
  friends: {
    width: '100%',
    height: 120,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
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
