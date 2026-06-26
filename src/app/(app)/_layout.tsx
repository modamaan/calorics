import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { getUserProfile } from '@/lib/api/firestore';
import { DateProvider } from '@/context/DateContext';

export default function AppLayout() {
  const { userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      if (!userId) return;

      try {
        const localStatus = await AsyncStorage.getItem(`onboardingComplete_${userId}`);

        if (localStatus === 'true') {
          setIsChecking(false);
          // If we are trying to just load the app, we can optionally ensure we are in tabs
          // But expo router usually handles default index if we set it up.
          return;
        }

        const profile = await getUserProfile(userId);

        if (profile?.onboardingComplete) {
          await AsyncStorage.setItem(`onboardingComplete_${userId}`, 'true');
          setIsChecking(false);
        } else {
          setIsChecking(false);
          const currentSegment = segments[segments.length - 1] as string;
          // Don't redirect if we are already in the onboarding flow
          if (currentSegment !== 'onboarding' && currentSegment !== 'generating-plan') {
            router.replace('/(app)/onboarding');
          }
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, [userId, segments]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <DateProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="generating-plan" options={{ headerShown: false }} />
        <Stack.Screen name="add-meal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="edit-goals" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="edit-water" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="log-exercise" options={{ headerShown: false }} />
        <Stack.Screen name="log-exercise-details" options={{ headerShown: false }} />
        <Stack.Screen name="log-manual-exercise" options={{ headerShown: false }} />
        <Stack.Screen name="add-water" options={{ headerShown: false }} />
      </Stack>
    </DateProvider>
  );
}
