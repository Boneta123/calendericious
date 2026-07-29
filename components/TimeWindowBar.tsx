import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { formatClock } from '../utils/date';

/**
 * A 24-hour track that literally "blocks off" a deal's active window.
 * All-day deals fill the whole track in basil; timed deals fill only the
 * active hours in tomato, so you can read at a glance when to show up.
 */
export function TimeWindowBar({
  startTime,
  endTime,
}: {
  startTime: string | null;
  endTime: string | null;
}) {
  const allDay = startTime === null;

  const toFraction = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h * 60 + m) / (24 * 60);
  };

  const left = allDay ? 0 : toFraction(startTime!);
  const right = allDay ? 1 : toFraction(endTime ?? '23:59');
  const widthPct = Math.max(0.04, right - left);

  return (
    <View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              left: `${left * 100}%`,
              width: `${widthPct * 100}%`,
              backgroundColor: allDay ? colors.basil : colors.tomato,
            },
          ]}
        />
      </View>
      <View style={styles.scale}>
        <Text style={styles.tick}>12a</Text>
        <Text style={styles.tick}>6a</Text>
        <Text style={styles.tick}>12p</Text>
        <Text style={styles.tick}>6p</Text>
        <Text style={styles.tick}>12a</Text>
      </View>
      <Text style={styles.window}>
        {allDay ? 'Available all day' : `${formatClock(startTime!)} – ${formatClock(endTime ?? '23:59')}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.paperDeep,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: radii.pill,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  tick: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkFaint },
  window: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
});
