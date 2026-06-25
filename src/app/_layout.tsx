/**
 * Root layout — wraps the entire app in ClerkProvider with secure token caching.
 * Handles auth-based routing: unauthenticated → sign-in, authenticated → app.
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import { saveUserProfile } from '@/lib/api/firestore';

// Must be called at the root level so it fires when the OAuth redirect
// brings the user back to the app (calorics:// deep link → root layout renders first).
WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the android browser to improve UX and prevent hanging
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

/** Redirects between auth and app groups based on Clerk session state. */
function AuthGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  // Sync Clerk user to Firebase Firestore globally
  useEffect(() => {
    if (user) {
      const isGoogle = user.externalAccounts?.some((acc) => acc.provider === 'google');
      
      saveUserProfile(user.id, {
        email: user.primaryEmailAddress?.emailAddress || '',
        displayName: user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
        photoURL: user.imageUrl || null,
        provider: isGoogle ? 'google' : 'email',
      }).catch((err) => console.error('[Firebase Sync] Failed to sync user:', err));
    }
  }, [user?.id]); // Runs once when user object becomes available

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(app)/(tabs)/home');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useWarmUpBrowser();
  
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthGate />
    </ClerkProvider>
  );
}
