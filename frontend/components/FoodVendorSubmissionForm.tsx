import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createFoodVendor, lookupAddress, PlaceCandidate } from '../data/api';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';
import { TextField } from './TextField';

/** Crowdsourced food-vendor submission (convenience store / grocer). The user
 *  types the store's ADDRESS; we list the businesses Google has at that address
 *  and the user picks the right one. Users may add 2 places per day. */
export interface FoodVendorDraft {
  name: string;
  url: string;
  address: string;
  logoUrl: string;
  lat: number;
  lng: number;
}

function hostOf(url: string): string {
  return url.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}
function faviconFor(host: string): string {
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : '';
}

/** Small downward map-pin (drawn with Views — no icon lib/emoji). */
function MapPin() {
  return (
    <View style={styles.pin}>
      <View style={styles.pinHead} />
      <View style={styles.pinTail} />
    </View>
  );
}

export function FoodVendorSubmissionForm() {
  // Address is entered as separate fields so the user never formats a string.
  const [street, setStreet] = useState('');
  const [town, setTown] = useState('');
  const [stateField, setStateField] = useState('');
  const [zip, setZip] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [selected, setSelected] = useState<PlaceCandidate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [dailyLimited, setDailyLimited] = useState(false);
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const host = useMemo(() => hostOf(url), [url]);
  const logoUrl = useMemo(() => faviconFor(host), [host]);
  const showLogo = host.includes('.');

  const check = async () => {
    setVerifyError(null);
    if (!street.trim() || (!town.trim() && !stateField.trim() && !zip.trim())) {
      setVerifyError('Enter at least the street and town.');
      return;
    }
    setVerifying(true);
    try {
      const list = await lookupAddress({
        street: street.trim(), town: town.trim(), state: stateField.trim(), zip: zip.trim(),
      });
      setCandidates(list);
      if (list.length === 1) setSelected(list[0]); // only one place → pick it for them
      setErrors((e) => ({ ...e, place: '' }));
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) setDailyLimited(true);
      else setVerifyError(err instanceof Error ? err.message : 'Could not look up that address.');
    } finally {
      setVerifying(false);
    }
  };

  // Back to the address fields (a fresh lookup); clears any current results.
  const editAddress = () => {
    setCandidates([]);
    setSelected(null);
    setVerifyError(null);
  };

  const reset = () => {
    setStreet('');
    setTown('');
    setStateField('');
    setZip('');
    setCandidates([]);
    setSelected(null);
    setVerifyError(null);
    setDailyLimited(false);
    setUrl('');
    setErrors({});
    setFormError(null);
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!selected) next.place = 'Check the address and pick the food vendor first.';
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) next.url = 'Enter a valid website URL (https://…).';
    setErrors(next);
    if (Object.keys(next).length > 0 || !selected) return;

    const draft: FoodVendorDraft = {
      name: selected.primary,
      url: url.trim(),
      address: selected.secondary,
      logoUrl,
      lat: selected.lat,
      lng: selected.lng,
    };
    setSubmitting(true);
    setFormError(null);
    try {
      await createFoodVendor(draft);
      setSubmitted(true);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) setDailyLimited(true);
      else setFormError(err instanceof Error ? err.message : 'Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (dailyLimited) {
    return (
      <View style={styles.success}>
        <Text style={styles.successTitle}>Daily limit reached</Text>
        <Text style={styles.successSub}>You can add 2 places per day. Come back tomorrow to add more.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.intro}>
        Enter the store's address — we'll list the places there so you can pick the right one.
      </Text>

      <Text style={styles.label}>Food vendor address</Text>
      {selected ? (
        <View style={styles.selectedRow}>
          <MapPin />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName} numberOfLines={1}>{selected.primary}</Text>
            <Text style={styles.selectedAddr} numberOfLines={2}>{selected.secondary}</Text>
          </View>
          <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
      ) : candidates.length > 0 ? (
        <>
          <Text style={styles.pickHint}>Pick the place at this address:</Text>
          {candidates.map((c, i) => (
            <Pressable
              key={c.placeId || `${c.primary}-${i}`}
              onPress={() => setSelected(c)}
              style={({ pressed }) => [styles.candidate, pressed && styles.candidatePressed]}
              accessibilityRole="button"
              accessibilityLabel={`${c.primary}, ${c.secondary}`}
            >
              <MapPin />
              <View style={{ flex: 1 }}>
                <Text style={styles.candidateName} numberOfLines={1}>{c.primary}</Text>
                {!!c.secondary && <Text style={styles.candidateAddr} numberOfLines={1}>{c.secondary}</Text>}
              </View>
            </Pressable>
          ))}
          <Pressable onPress={editAddress} accessibilityRole="button" style={styles.editAddress}>
            <Text style={styles.editAddressText}>Use a different address</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextField
            label="Street address"
            value={street}
            onChangeText={setStreet}
            placeholder="123 Main St"
            autoCapitalize="words"
          />
          <TextField
            label="Town / City"
            value={town}
            onChangeText={setTown}
            placeholder="Vestal"
            autoCapitalize="words"
          />
          <TextField
            label="State"
            value={stateField}
            onChangeText={setStateField}
            placeholder="NY"
            autoCapitalize="characters"
          />
          <TextField
            label="ZIP code"
            value={zip}
            onChangeText={setZip}
            placeholder="13850"
            keyboardType="number-pad"
            maxLength={10}
          />
          <Pressable
            onPress={check}
            disabled={verifying}
            style={({ pressed }) => [styles.verifyBtn, pressed && styles.verifyBtnPressed]}
            accessibilityRole="button"
          >
            {verifying ? (
              <ActivityIndicator size="small" color={colors.tomato} />
            ) : (
              <Text style={styles.verifyBtnText}>Check address</Text>
            )}
          </Pressable>
          {verifyError ? <Text style={styles.errText}>{verifyError}</Text> : null}
          {errors.place ? <Text style={styles.errText}>{errors.place}</Text> : null}
        </>
      )}

      <TextField
        label="Website URL"
        value={url}
        onChangeText={setUrl}
        placeholder="https://www.7-eleven.com"
        keyboardType="url"
        error={errors.url}
      />
      {showLogo ? (
        <View style={styles.logoPreview}>
          <RestaurantLogo restaurant={{ name: selected?.primary || host, logoUrl }} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logoTitle}>Logo preview</Text>
            <Text style={styles.logoSub}>Pulled from the website — this is the icon we'll use.</Text>
          </View>
        </View>
      ) : null}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <PrimaryButton
        label={submitting ? 'Submitting…' : 'Submit food vendor'}
        onPress={handleSubmit}
        disabled={submitting || !selected}
        style={{ marginTop: spacing.sm }}
      />
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
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  verifyBtn: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.tomato,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  verifyBtnPressed: { backgroundColor: colors.tomatoWash },
  verifyBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.tomato },
  errText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tomatoDeep, marginTop: spacing.xs },
  pickHint: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, marginBottom: spacing.sm },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  candidatePressed: { backgroundColor: colors.tomatoWash },
  candidateName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  candidateAddr: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  editAddress: { paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  editAddressText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.tomato },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectedName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  selectedAddr: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  change: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.tomato, textTransform: 'uppercase' },
  pin: { width: 16, alignItems: 'center' },
  pinHead: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.tomato },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.tomato,
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
  formError: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.tomatoDeep,
    marginTop: spacing.sm,
  },
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
