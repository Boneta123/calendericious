/**
 * "How it works" explainer — tells users how the two toggles + crowdsourcing
 * fit together: select the chains I add, flip "Near me" for community-added
 * local spots, and every deal itself is user-submitted. Opened from a small
 * "How it works" link on the calendar home.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const POINTS: { dot: string; title: string; body: string }[] = [
  {
    dot: colors.tomato,
    title: 'Pick your chains',
    body: 'Big-name places are ready to select. Choose the ones you like — their deals show up on your calendar.',
  },
  {
    dot: colors.basil,
    title: 'Tap “Near me” for local spots',
    body: 'Independent, one-off places added by the community stay hidden until you turn “Near me” on — then you’ll see the ones within your chosen distance (10, 25, or 50 miles). We’ll ask for your location.',
  },
  {
    dot: colors.mustard,
    title: 'Deals are community-powered',
    body: 'Every deal — for the big chains and the local spots alike — is added by users. People also add the local places themselves.',
  },
];

export function HowItWorksModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop propagation so taps inside the card don't dismiss. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>How it works</Text>
          <View style={styles.list}>
            {POINTS.map((p) => (
              <View key={p.title} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: p.dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowBody}>{p.body}</Text>
                </View>
              </View>
            ))}
          </View>
          <PrimaryButton label="Got it" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: spacing.lg },
  list: { gap: spacing.lg, marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  rowBody: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 2, lineHeight: 20 },
});
