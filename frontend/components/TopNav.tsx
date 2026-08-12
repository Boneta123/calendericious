import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/theme';

/**
 * Top navbar for the authed area. Two segments — the Deal Calendar and the
 * crowdsourcing Submissions page. Active tab is derived from the current route
 * (`usePathname`); tapping the other one replaces the route (no back-stack
 * buildup). Rendered at the top of both the calendar and submissions screens.
 */
export function TopNav() {
  const pathname = usePathname();

  const Tab = ({
    label,
    href,
    active,
  }: {
    label: string;
    href: '/(app)' | '/(app)/submissions';
    active: boolean;
  }) => (
    <Pressable
      onPress={() => !active && router.replace(href)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      <View style={[styles.underline, active && styles.underlineActive]} />
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      {/* Route groups are stripped from pathname: index → "/", submissions → "/submissions". */}
      <Tab label="Deal Calendar" href="/(app)" active={pathname === '/'} />
      <Tab label="Submissions" href="/(app)/submissions" active={pathname === '/submissions'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.xs },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.inkSoft,
    paddingBottom: spacing.sm,
  },
  labelActive: { color: colors.tomato },
  underline: {
    height: 3,
    width: '60%',
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  underlineActive: { backgroundColor: colors.tomato },
});
