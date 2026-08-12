import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';
import { TextField } from './TextField';

/** Draft a crowdsourced restaurant submission. Frontend only — on submit we
 *  just log the payload; a reviewer/backend flow comes later. Fields mirror the
 *  Restaurant schema (name, url, logoUrl) PLUS a new address box. */
export interface RestaurantDraft {
  name: string;
  url: string;
  address: string;
  logoUrl: string; // favicon derived from the website host (same as the seed/app)
}

/** Hostname from a URL (matches the app's hostOf). */
function hostOf(url: string): string {
  return url.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}
/** Google favicon service by host — identical to how the app/seed build logos. */
function faviconFor(host: string): string {
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : '';
}

export function RestaurantSubmissionForm() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Live favicon preview derived from the website host — the logo the app will use.
  const host = useMemo(() => hostOf(url), [url]);
  const logoUrl = useMemo(() => faviconFor(host), [host]);
  const showLogo = host.includes('.');

  const reset = () => {
    setName('');
    setUrl('');
    setAddress('');
    setErrors({});
    setSubmitted(false);
  };

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Restaurant name is required.';
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) next.url = 'Enter a valid website URL (https://…).';
    if (!address.trim()) next.address = 'Address is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const draft: RestaurantDraft = {
      name: name.trim(),
      url: url.trim(),
      address: address.trim(),
      logoUrl,
    };
    // TODO: backend — POST this draft to a restaurant-submission endpoint.
    console.log('[submission] restaurant draft', draft);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.success}>
        <Text style={styles.successTitle}>Thanks — submitted for review</Text>
        <Text style={styles.successSub}>We'll check it out and add it to the app.</Text>
        <PrimaryButton label="Submit another" onPress={reset} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.intro}>Add a restaurant that isn't on the app yet.</Text>
      <TextField
        label="Restaurant name"
        value={name}
        onChangeText={setName}
        placeholder="Joe's Pizza"
        autoCapitalize="words"
        error={errors.name}
      />
      <TextField
        label="Website URL"
        value={url}
        onChangeText={setUrl}
        placeholder="https://www.joespizza.com"
        keyboardType="url"
        error={errors.url}
      />
      {showLogo ? (
        <View style={styles.logoPreview}>
          <RestaurantLogo restaurant={{ name: name || host, logoUrl }} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logoTitle}>Logo preview</Text>
            <Text style={styles.logoSub}>Pulled from the website — this is the icon we'll use.</Text>
          </View>
        </View>
      ) : null}
      <TextField
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="123 Main St, City, ST 10001"
        autoCapitalize="words"
        error={errors.address}
      />
      <PrimaryButton label="Submit restaurant" onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  logoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logoTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  logoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  success: { alignItems: 'center', paddingVertical: spacing.xxxl },
  successTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: 'center' },
  successSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
