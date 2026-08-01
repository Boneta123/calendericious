import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/** Entry gate: send authed users to the calendar, everyone else to sign-in. */
export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
