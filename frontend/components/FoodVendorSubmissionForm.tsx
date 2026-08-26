import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createFoodVendor, placesAutocomplete, PlaceSuggestion } from '../data/api';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';
import { TextField } from './TextField';

/** Crowdsourced food-vendor submission (convenience store / grocer). Name +
 *  address come from Google Places (type the name → pick the location); no
 *  manual address entry. */
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
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  // Search is limited to 50mi around the device, so a location is REQUIRED.
  const [locStatus, setLocStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the device location — required to search (results are within 50mi of it).
  const requestLocation = useCallback(async () => {
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocStatus('ready');
    } catch {
      setLocStatus('denied');
    }
  }, []);
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    if (debounce.current) clearTimeout(debounce.current);
    if (q.length < 3 || !coords) {
      // Wait for 3+ chars (fewer API calls) and a device location (required —
      // results are limited to 50mi around the user).
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(() => {
      placesAutocomplete(q, coords, 'food')
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
  const noResults =
    !searching && !!coords && query.trim().length >= 3 && suggestions.length === 0;

  const pick = (s: PlaceSuggestion) => {
    // LocationIQ suggestions already include the full address — no extra lookup.
    setSelected({ name: s.primary, address: s.secondary, lat: s.lat, lng: s.lng });
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
    if (!selected) next.place = 'Search and select your food vendor.';
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) next.url = 'Enter a valid website URL (https://…).';
    setErrors(next);
    if (Object.keys(next).length > 0 || !selected) return;

    const draft: FoodVendorDraft = {
      name: selected.name,
      url: url.trim(),
      address: selected.address,
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
        Search a convenience store or grocer and pick its location — the address fills in for you.
      </Text>

      <Text style={styles.label}>Food vendor</Text>
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
              placeholder="Search a food vendor…"
              placeholderTextColor={colors.inkFaint}
              autoCorrect={false}
              style={styles.search}
              accessibilityLabel="Search for a food vendor"
            />
            {searching ? <ActivityIndicator size="small" color={colors.tomato} style={styles.searchSpin} /> : null}
          </View>
          {locStatus === 'denied' ? (
            <View style={styles.locHint}>
              <Text style={styles.locHintText}>
                Turn on location to search for places within 50 miles of you.
              </Text>
              <Pressable onPress={requestLocation} accessibilityRole="button">
                <Text style={styles.locHintLink}>Enable location</Text>
              </Pressable>
            </View>
          ) : locStatus === 'loading' && query.trim().length >= 3 ? (
            <Text style={styles.locLoading}>Finding your location…</Text>
          ) : null}
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
        placeholder="https://www.7-eleven.com"
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
        label={submitting ? 'Submitting…' : 'Submit food vendor'}
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
  locHint: { paddingVertical: spacing.md, gap: spacing.xs },
  locHintText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, lineHeight: 19 },
  locHintLink: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.tomato },
  locLoading: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, paddingVertical: spacing.md },
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
