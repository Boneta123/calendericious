import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/theme';

/** Guards the authed area — kicks back to login when there's no user. */
export default function AppLayout() {
  const { user } = useAuth();
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
