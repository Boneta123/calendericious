import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFoodVendors } from '../context/FoodVendorContext';
import { fetchFoodVendors, FoodVendor } from '../data/foodVendors';
import { colors, fonts, radii, shadow, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';
import { RestaurantLogo } from './RestaurantLogo';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Searchable multi-select over the food-vendor catalog (mirrors the restaurant
 *  picker). Selection drives which food-vendor deals show in the calendar's
 *  food-vendor view. */
export function FoodVendorPickerModal({ visible, onClose }: Props) {
  const { isSelected, toggle, count } = useFoodVendors();
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState<FoodVendor[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchFoodVendors()
      .then((v) => setVendors(v))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [query, vendors]);

  const renderItem = ({ item }: { item: FoodVendor }) => {
    const selected = isSelected(item.id);
    return (
      <Pressable
        onPress={() => toggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={item.name}
        style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
      >
        <RestaurantLogo restaurant={item} size={46} />
        <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Food vendors</Text>
            <Text style={styles.sub}>
              Convenience stores & grocers with deals. Turn on "Food vendors" on the calendar to see
              them. <Text style={styles.count}>{count} selected</Text>
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search food vendors…"
              placeholderTextColor={colors.inkFaint}
              autoCorrect={false}
              style={styles.search}
              accessibilityLabel="Search food vendors"
            />
          </View>

          <FlatList
            data={data}
            keyExtractor={(v) => v.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              loading ? (
                <Text style={styles.empty}>Loading…</Text>
              ) : query.trim() ? (
                <Text style={styles.empty}>No food vendors match "{query.trim()}".</Text>
              ) : (
                <Text style={styles.empty}>No food vendors yet — add one from the Submissions tab.</Text>
              )
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <PrimaryButton label={count > 0 ? `Done · ${count}` : 'Done'} onPress={onClose} />
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
  check: { width: 26, height: 26, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
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
});
