import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createRestaurant, placesAutocomplete, PlaceSuggestion } from '../data/api';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';
import { TextField } from './TextField';

/** Crowdsourced restaurant submission. The restaurant + address come from Google
 *  Places (type the name → pick the location); no manual address entry. */
export interface RestaurantDraft {
  name: string;
  url: string;
  address: string;
  logoUrl: string;
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

export function RestaurantSubmissionForm() {
  // Places search
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<{ name: string; address: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  // Website (for the logo) — prefilled from Places when available, still editable.
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bias suggestions to the device location (best-effort; ignored if denied).
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* no location — autocomplete still works, just unbiased */
      }
    })();
  }, []);

  // Debounced autocomplete on the typed restaurant name.
  useEffect(() => {
    if (selected) return; // already picked
    const q = query.trim();
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(() => {
      placesAutocomplete(q, coords, 'restaurant')
        .then((s) => setSuggestions(s))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, coords, selected]);

  const host = useMemo(() => hostOf(url), [url]);
  const logoUrl = useMemo(() => faviconFor(host), [host]);
  const showLogo = host.includes('.');
  const noResults = !searching && query.trim().length >= 2 && suggestions.length === 0;

  const pick = (s: PlaceSuggestion) => {
    // LocationIQ suggestions already include the full address — no extra lookup.
    setSelected({ name: s.primary, address: s.secondary });
    setQuery('');
    setSuggestions([]);
    setErrors((e) => ({ ...e, place: '' }));
  };

  const reset = () => {
    setQuery('');
    setSuggestions([]);
    setSelected(null);
    setUrl('');
    setErrors({});
    setFormError(null);
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!selected) next.place = 'Search and select your restaurant.';
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) next.url = 'Enter a valid website URL (https://…).';
    setErrors(next);
    if (Object.keys(next).length > 0 || !selected) return;

    const draft: RestaurantDraft = {
      name: selected.name,
      url: url.trim(),
      address: selected.address,
      logoUrl,
    };
    setSubmitting(true);
    setFormError(null);
    try {
      await createRestaurant(draft);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit. Try again.');
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

  return (
    <View>
      <Text style={styles.intro}>
        Search your restaurant and pick its location — the address fills in for you.
      </Text>

      <Text style={styles.label}>Restaurant</Text>
      {selected ? (
        <View style={styles.selectedRow}>
          <MapPin />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName} numberOfLines={1}>{selected.name}</Text>
            <Text style={styles.selectedAddr} numberOfLines={2}>{selected.address}</Text>
          </View>
          <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search a restaurant…"
              placeholderTextColor={colors.inkFaint}
              autoCorrect={false}
              style={styles.search}
              accessibilityLabel="Search for a restaurant"
            />
            {searching ? <ActivityIndicator size="small" color={colors.tomato} style={styles.searchSpin} /> : null}
          </View>
          {suggestions.map((s) => (
            <Pressable
              key={s.placeId}
              onPress={() => pick(s)}
              style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${s.primary}, ${s.secondary}`}
            >
              <MapPin />
              <View style={{ flex: 1 }}>
                <Text style={styles.sugPrimary} numberOfLines={1}>{s.primary}</Text>
                {!!s.secondary && <Text style={styles.sugSecondary} numberOfLines={1}>{s.secondary}</Text>}
              </View>
            </Pressable>
          ))}
          {noResults && <Text style={styles.noResults}>no locations found check for typos</Text>}
          {errors.place ? <Text style={styles.errText}>{errors.place}</Text> : null}
        </>
      )}

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
          <RestaurantLogo restaurant={{ name: selected?.name || host, logoUrl }} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logoTitle}>Logo preview</Text>
            <Text style={styles.logoSub}>Pulled from the website — this is the icon we'll use.</Text>
          </View>
        </View>
      ) : null}

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <PrimaryButton
        label={submitting ? 'Submitting…' : 'Submit restaurant'}
        onPress={handleSubmit}
        disabled={submitting}
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
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginBottom: spacing.xs },
  searchWrap: { justifyContent: 'center' },
  search: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingRight: 40,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
  },
  searchSpin: { position: 'absolute', right: spacing.md },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  suggestionPressed: { backgroundColor: colors.tomatoWash },
  sugPrimary: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  sugSecondary: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  noResults: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.inkSoft,
    paddingVertical: spacing.md,
  },
  errText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tomatoDeep, marginTop: spacing.xs },
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
  // Map pin (circle head + downward triangle tail)
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
