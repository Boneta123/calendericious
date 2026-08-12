import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRestaurantSelection } from '../context/RestaurantSelectionContext';
import { RESTAURANTS, Restaurant } from '../data/restaurants';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';

interface Props {
  visible: boolean;
  /** 'edit' = profile (dismissible, Done). 'onboarding' = required post-signup gate. */
  mode?: 'edit' | 'onboarding';
  /** Recommended restaurants pinned to the top (onboarding). */
  recommended?: Restaurant[];
  /** Called when Done (edit) is tapped or backdrop dismissed. */
  onClose?: () => void;
  /** Called when Continue (onboarding) is tapped — only reachable with ≥1 selected. */
  onContinue?: () => void;
}

/**
 * Vibrant multi-select restaurant picker. Selection isn't color-only — a
 * selected row gets a tomato ring AND a checkmark badge (a11y).
 *
 * Onboarding mode: shown right after sign-up. User MUST pick at least one to
 * continue; Continue is disabled until then. Recommended chains are pinned up
 * top. Copy reminds them they can change this later in Profile.
 */
export function RestaurantPickerModal({
  visible,
  mode = 'edit',
  recommended = [],
  onClose,
  onContinue,
}: Props) {
  const { isSelected, toggle, count } = useRestaurantSelection();
  const onboarding = mode === 'onboarding';
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  // Required-field validation (frontend only): block Continue with a clear
  // message until at least one restaurant is chosen.
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (count > 0 && error) setError(null);
  }, [count, error]);

  const handleContinue = () => {
    if (count === 0) {
      setError('Pick at least one restaurant to continue.');
      return;
    }
    setError(null);
    onContinue?.();
  };

  // When searching, filter the full list by name. Otherwise (onboarding) pin
  // the recommended chains to the top, deduped against the full list.
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q));
    if (!onboarding || recommended.length === 0) return RESTAURANTS;
    const recIds = new Set(recommended.map((r) => r.id));
    return [...recommended, ...RESTAURANTS.filter((r) => !recIds.has(r.id))];
  }, [onboarding, recommended, query]);

  const recIdSet = useMemo(() => new Set(recommended.map((r) => r.id)), [recommended]);

  const renderItem = ({ item, index }: { item: Restaurant; index: number }) => {
    const selected = isSelected(item.id);
    const showRecLabel = !searching && onboarding && recIdSet.size > 0 && index === 0;
    const showAllLabel = !searching && onboarding && recIdSet.size > 0 && index === recIdSet.size;
    return (
      <>
        {showRecLabel && <Text style={styles.groupLabel}>Recommended to start</Text>}
        {showAllLabel && <Text style={styles.groupLabel}>All restaurants</Text>}
        <Pressable
          onPress={() => toggle(item.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={item.name}
          style={({ pressed }) => [
            styles.row,
            selected && styles.rowSelected,
            pressed && styles.rowPressed,
          ]}
        >
          <RestaurantLogo restaurant={item} size={46} />
          <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
            {selected && <Text style={styles.checkMark}>✓</Text>}
          </View>
        </Pressable>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Onboarding is a required gate — no hardware-back dismissal.
      onRequestClose={onboarding ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {onboarding ? 'Pick your spots' : 'Pick your spots'}
            </Text>
            <Text style={styles.sub}>
              {onboarding
                ? 'Choose at least one to get started — you can add more or change these anytime in your Profile.'
                : 'Only these show up in your deals.'}{' '}
              <Text style={styles.count}>{count} selected</Text>
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search restaurants…"
              placeholderTextColor={colors.inkFaint}
              autoCorrect={false}
              style={styles.search}
              accessibilityLabel="Search restaurants"
            />
          </View>

          <FlatList
            data={data}
            keyExtractor={(r) => r.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searching ? <Text style={styles.empty}>No restaurants match "{query.trim()}".</Text> : null
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            {onboarding ? (
              <>
                {!!error && <Text style={styles.error}>{error}</Text>}
                <PrimaryButton
                  label={count > 0 ? `Continue · ${count}` : 'Continue'}
                  onPress={handleContinue}
                />
              </>
            ) : (
              <PrimaryButton
                label={count > 0 ? `Done · ${count}` : 'Done'}
                onPress={() => onClose?.()}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: spacing.md,
    height: '82%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 2, lineHeight: 20 },
  count: { fontFamily: fonts.bodyBold, color: colors.tomato },
  searchWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  search: {
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink,
  },
  empty: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  groupLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.soft,
  },
  rowSelected: { borderColor: colors.tomato, backgroundColor: colors.tomatoWash },
  rowPressed: { opacity: 0.7 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  nameSelected: { color: colors.tomatoDeep },
  check: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: { borderWidth: 2, borderColor: colors.line },
  checkOn: { backgroundColor: colors.tomato },
  checkMark: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 15 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.tomatoDeep,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
