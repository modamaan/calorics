import * as WebBrowser from 'expo-web-browser';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

// Required for Clerk OAuth (useSSO) to complete the browser auth session
// when the browser redirects back to the app after Google sign-in.
WebBrowser.maybeCompleteAuthSession();

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    />
  );
}
