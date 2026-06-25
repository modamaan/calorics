import { Redirect } from 'expo-router';

/**
 * Root index — immediately redirects to sign-in.
 * The AuthGate in _layout.tsx handles redirecting authenticated users to /(app)/home.
 */
export default function RootIndex() {
  return <Redirect href="/(auth)/sign-in" />;
}
