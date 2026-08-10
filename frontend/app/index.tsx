import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/** Entry gate: send authed users to the calendar, everyone else to sign-in. */
export default function Index() {
  const { user, initializing } = useAuth();
  if (initializing) return null; // wait for session restore (splash covers this)
  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
