import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { RESTAURANTS, Restaurant } from '../data/restaurants';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';
import { TextField } from './TextField';

type Category = 'DAY' | 'TIME' | 'LIMITED_TIME' | 'BIRTHDAY';
type BirthdayWindow = 'DAY' | 'WEEK' | 'MONTH';

/** Draft a crowdsourced deal submission. Frontend only — on submit we just log
 *  the payload. Field names mirror the Deal schema so backend wiring is a
 *  drop-in later. Timing fields COMBINE freely: a deal can run on specific days,
 *  within a time window, AND over a date range all at once. */
export interface DealDraft {
  restaurantId: string;
  title: string;
  description: string;
  category: Category; // derived from the timing fields below
  daysOfWeek: number[]; // 0=Sun..6=Sat
  startTime: string | null; // "HH:MM"
  endTime: string | null; // "HH:MM"
  validFrom: string | null; // "MM/DD"
  validThrough: string | null; // "MM/DD"
  birthdayWindow: BirthdayWindow | null;
  requiresRewards: boolean;
  onlineOrderOnly: boolean;
  sourceUrl: string | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WINDOWS: BirthdayWindow[] = ['DAY', 'WEEK', 'MONTH'];

const pad = (n: number) => String(n).padStart(2, '0');
const mmdd = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
function thisWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + (6 - now.getDay())); // through Saturday
  return { from: mmdd(now), to: mmdd(end) };
}
function thisMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: mmdd(first), to: mmdd(last) };
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipOn]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function DealSubmissionForm({ onAddRestaurant }: { onAddRestaurant: () => void }) {
  const [query, setQuery] = useState('');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Combinable timing — any mix of days / time window / date range.
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validThrough, setValidThrough] = useState('');
  // Birthday deals are windowed around the user's birthday, so they replace the
  // day/time/date section rather than combine with it.
  const [isBirthday, setIsBirthday] = useState(false);
  const [birthdayWindow, setBirthdayWindow] = useState<BirthdayWindow | null>(null);
  const [requiresRewards, setRequiresRewards] = useState(false);
  const [onlineOrderOnly, setOnlineOrderOnly] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  const toggleEveryDay = () => setDays((prev) => (prev.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]));

  // Derive the schema category from whatever timing the user filled in.
  const derivedCategory: Category = isBirthday
    ? 'BIRTHDAY'
    : validFrom.trim() || validThrough.trim()
      ? 'LIMITED_TIME'
      : startTime.trim() || endTime.trim()
        ? 'TIME'
        : 'DAY';

  const reset = () => {
    setQuery('');
    setRestaurant(null);
    setTitle('');
    setDescription('');
    setDays([]);
    setStartTime('');
    setEndTime('');
    setValidFrom('');
    setValidThrough('');
    setIsBirthday(false);
    setBirthdayWindow(null);
    setRequiresRewards(false);
    setOnlineOrderOnly(false);
    setSourceUrl('');
    setErrors({});
    setSubmitted(false);
  };

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!restaurant) next.restaurant = 'Pick the restaurant this deal is for.';
    if (!title.trim()) next.title = 'A deal name is required.';
    if (!description.trim()) next.description = 'Describe the deal.';
    if (isBirthday && !birthdayWindow) next.birthdayWindow = 'Pick a birthday window.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !restaurant) return;

    const draft: DealDraft = {
      restaurantId: restaurant.id,
      title: title.trim(),
      description: description.trim(),
      category: derivedCategory,
      daysOfWeek: isBirthday ? [] : days,
      startTime: !isBirthday && startTime.trim() ? startTime.trim() : null,
      endTime: !isBirthday && endTime.trim() ? endTime.trim() : null,
      validFrom: !isBirthday && validFrom.trim() ? validFrom.trim() : null,
      validThrough: !isBirthday && validThrough.trim() ? validThrough.trim() : null,
      birthdayWindow: isBirthday ? birthdayWindow : null,
      requiresRewards,
      onlineOrderOnly,
      sourceUrl: sourceUrl.trim() || null,
    };
    // TODO: backend — POST this draft to a deal-submission endpoint.
    console.log('[submission] deal draft', draft);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.success}>
        <Text style={styles.successTitle}>Thanks — submitted for review</Text>
        <Text style={styles.successSub}>Nice find. We'll verify it and post it to the calendar.</Text>
        <PrimaryButton label="Submit another" onPress={reset} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View>
      {/* Restaurant search-select */}
      <Text style={styles.fieldLabel}>Restaurant</Text>
      {restaurant ? (
        <View style={[styles.selectedRow, shadow.soft]}>
          <RestaurantLogo restaurant={restaurant} size={40} />
          <Text style={styles.selectedName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Pressable onPress={() => setRestaurant(null)} accessibilityRole="button">
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextField
            label=""
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants…"
            error={errors.restaurant}
          />
          {matches.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setRestaurant(r);
                setQuery('');
                if (errors.restaurant) setErrors((e) => ({ ...e, restaurant: '' }));
              }}
              style={({ pressed }) => [styles.matchRow, pressed && styles.matchPressed]}
              accessibilityRole="button"
              accessibilityLabel={r.name}
            >
              <RestaurantLogo restaurant={r} size={34} />
              <Text style={styles.matchName} numberOfLines={1}>
                {r.name}
              </Text>
            </Pressable>
          ))}
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Not seeing your restaurant? If it isn't showing up, it isn't on the app yet — add it.
            </Text>
            <Pressable onPress={onAddRestaurant} accessibilityRole="button">
              <Text style={styles.tooltipLink}>Add a restaurant</Text>
            </Pressable>
          </View>
        </>
      )}

      <View style={{ height: spacing.md }} />
      <TextField label="Deal name" value={title} onChangeText={setTitle} placeholder="Taco Tuesday" autoCapitalize="sentences" error={errors.title} />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="$1 tacos all day every Tuesday, dine-in only."
        placeholderTextColor={colors.inkFaint}
        multiline
        style={[styles.multiline, errors.description ? styles.inputError : null]}
      />
      {errors.description ? <Text style={styles.errText}>{errors.description}</Text> : null}

      {/* Birthday toggle — swaps the combinable timing for a birthday window */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>This is a birthday deal</Text>
        <Switch value={isBirthday} onValueChange={setIsBirthday} trackColor={{ true: colors.tomato }} />
      </View>

      {isBirthday ? (
        <>
          <Text style={styles.fieldLabel}>Birthday window</Text>
          <View style={styles.chipRow}>
            {WINDOWS.map((w) => (
              <Chip key={w} label={w[0] + w.slice(1).toLowerCase()} active={birthdayWindow === w} onPress={() => setBirthdayWindow(w)} />
            ))}
          </View>
          {errors.birthdayWindow ? <Text style={styles.errText}>{errors.birthdayWindow}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>When does it run?</Text>
          <Text style={styles.sectionHint}>
            Combine any of these — specific days, a time window, and/or a date range. e.g. "this month, on
            these days, at these times."
          </Text>

          {/* Days */}
          <Text style={styles.fieldLabel}>Days</Text>
          <View style={styles.chipRow}>
            <Chip label="Every day" active={days.length === 7} onPress={toggleEveryDay} />
            {WEEKDAYS.map((w, i) => (
              <Chip key={w} label={w} active={days.includes(i)} onPress={() => toggleDay(i)} />
            ))}
          </View>

          {/* Time window */}
          <Text style={styles.fieldLabel}>Time window (optional)</Text>
          <View style={styles.pairRow}>
            <View style={styles.pairItem}>
              <TextField label="Start (HH:MM)" value={startTime} onChangeText={setStartTime} placeholder="15:00" keyboardType="numbers-and-punctuation" mono />
            </View>
            <View style={styles.pairItem}>
              <TextField label="End (HH:MM)" value={endTime} onChangeText={setEndTime} placeholder="18:00" keyboardType="numbers-and-punctuation" mono />
            </View>
          </View>

          {/* Date range */}
          <Text style={styles.fieldLabel}>Date range (optional)</Text>
          <View style={styles.chipRow}>
            <Chip
              label="This week"
              active={false}
              onPress={() => {
                const r = thisWeekRange();
                setValidFrom(r.from);
                setValidThrough(r.to);
              }}
            />
            <Chip
              label="This month"
              active={false}
              onPress={() => {
                const r = thisMonthRange();
                setValidFrom(r.from);
                setValidThrough(r.to);
              }}
            />
          </View>
          <View style={styles.pairRow}>
            <View style={styles.pairItem}>
              <TextField label="From (MM/DD)" value={validFrom} onChangeText={setValidFrom} placeholder="09/16" keyboardType="numbers-and-punctuation" mono />
            </View>
            <View style={styles.pairItem}>
              <TextField label="Through (MM/DD)" value={validThrough} onChangeText={setValidThrough} placeholder="09/20" keyboardType="numbers-and-punctuation" mono />
            </View>
          </View>
        </>
      )}

      {/* Toggles */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Requires a rewards account</Text>
        <Switch value={requiresRewards} onValueChange={setRequiresRewards} trackColor={{ true: colors.tomato }} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Online / app order only</Text>
        <Switch value={onlineOrderOnly} onValueChange={setOnlineOrderOnly} trackColor={{ true: colors.tomato }} />
      </View>

      <TextField label="Source link (optional)" value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://…" keyboardType="url" />

      <PrimaryButton label="Submit deal" onPress={handleSubmit} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  selectedName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  change: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.tomato, textTransform: 'uppercase' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  matchPressed: { backgroundColor: colors.tomatoWash },
  matchName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  tooltip: {
    backgroundColor: colors.mustardWash,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tooltipText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  tooltipLink: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.tomato, marginTop: spacing.xs },
  multiline: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: colors.tomato },
  errText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tomatoDeep, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.line,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chipOn: { backgroundColor: colors.tomato, borderColor: colors.tomato },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  chipTextOn: { color: '#FFFFFF' },
  pairRow: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  toggleLabel: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  success: { alignItems: 'center', paddingVertical: spacing.xxxl },
  successTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: 'center' },
  successSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
