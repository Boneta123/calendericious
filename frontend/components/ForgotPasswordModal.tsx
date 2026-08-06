import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { forgotPassword, resetPassword } from '../data/api';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Two-step password reset (native — no deep links):
 *   Step 1: enter email → backend emails a 6-digit code.
 *   Step 2: enter code + new password → password is reset.
 */
export function ForgotPasswordModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setError(null);
    setBusy(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const sendCode = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setStep('code'); // generic — we advance regardless of whether the email exists
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (newPassword.length <= 7 || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must be more than 7 characters and include a special character.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {step === 'email' && (
            <>
              <Text style={styles.title}>Forgot password</Text>
              <Text style={styles.sub}>Enter your email and we'll send a 6-digit reset code.</Text>
              <TextField
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                placeholder="you@email.com"
                keyboardType="email-address"
                error={error}
              />
              <PrimaryButton label={busy ? 'Sending…' : 'Send reset code'} onPress={sendCode} disabled={busy} />
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={styles.title}>Enter your code</Text>
              <Text style={styles.sub}>
                If that email is registered, we sent a 6-digit code (check spam). It expires in 15 minutes.
              </Text>
              <TextField
                label="6-digit code"
                value={code}
                onChangeText={(t) => {
                  setCode(t.replace(/\D/g, '').slice(0, 6));
                  if (error) setError(null);
                }}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                mono
              />
              <TextField
                label="New password"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                secureTextEntry
                passwordToggle
                error={error}
                helper="More than 7 characters and at least one special character (!@#$…)."
              />
              <PrimaryButton label={busy ? 'Resetting…' : 'Reset password'} onPress={doReset} disabled={busy} />
            </>
          )}

          {step === 'done' && (
            <>
              <Text style={styles.title}>Password reset</Text>
              <Text style={styles.sub}>You can now log in with your new password.</Text>
              <PrimaryButton label="Back to log in" onPress={close} />
            </>
          )}

          {step !== 'done' && (
            <PrimaryButton label="Cancel" variant="ghost" onPress={close} style={{ marginTop: spacing.sm }} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
});
