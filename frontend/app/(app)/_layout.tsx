import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/theme';

/** Guards the authed area — kicks back to login when there's no user. */
export default function AppLayout() {
  const { user, initializing } = useAuth();
  if (initializing) return null; // wait for session restore before guarding
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
      }}
    />
  );
}
