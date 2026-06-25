import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenAI from 'openai';

import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { saveOnboardingData, saveFitnessPlan, OnboardingData, FitnessPlan } from '@/lib/api/firestore';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { AiBrain01Icon } from '@hugeicons/core-free-icons';

const LOADING_MESSAGES = [
  "Analyzing your profile...",
  "Calculating basal metabolic rate...",
  "Optimizing macronutrient split...",
  "Structuring hydration goals...",
  "Finalizing your personalized plan...",
];

export default function GeneratingPlanScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: dataString } = useLocalSearchParams<{ data: string }>();

  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Pulse animation for the AI icon
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withRepeat(
          withSequence(
            withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite
          true
        ),
      },
    ],
    opacity: withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    )
  }));

  // Cycle loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Main Generation Logic
  useEffect(() => {
    async function generateAndSave() {
      if (!userId || !dataString) {
        setError('Missing user data. Please try again.');
        return;
      }

      try {
        const onboardingData = JSON.parse(dataString) as OnboardingData;

        // Ensure OpenAI Key exists
        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("Missing EXPO_PUBLIC_OPENAI_API_KEY in .env.local");
        }

        const openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true // Required since we are calling from the mobile client
        });

        // Construct the prompt
        const age = new Date().getFullYear() - new Date(onboardingData.birthDate).getFullYear();
        const prompt = `
          You are an expert fitness and nutrition AI. Create a personalized daily fitness plan based on the following user data:
          - Gender: ${onboardingData.gender}
          - Age: ${age}
          - Goal: ${onboardingData.goal}
          - Workout Frequency: ${onboardingData.workoutDays}
          - Height: ${onboardingData.heightFeet} feet
          - Weight: ${onboardingData.weightKg} kg

          Respond ONLY with a valid JSON object matching this exact structure:
          {
            "dailyCalories": <number>,
            "proteins": <number in grams>,
            "carbs": <number in grams>,
            "fats": <number in grams>,
            "waterIntake": <number in liters>,
            "planSummary": "<string 2-3 sentences explaining the rationale behind this plan>",
            "fitnessTips": [
              "<string tip 1>",
              "<string tip 2>",
              "<string tip 3>"
            ]
          }
        `;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received from AI");

        const plan: FitnessPlan = JSON.parse(content);

        // Save everything to Firestore
        await saveOnboardingData(userId, onboardingData);
        await saveFitnessPlan(userId, plan);

        // Mark as locally complete to avoid redirect loops
        await AsyncStorage.setItem(`onboardingComplete_${userId}`, 'true');

        // Give a slight delay so the user sees the final message if it was fast
        setTimeout(() => {
          router.replace('/(app)/(tabs)/home');
        }, 1500);

      } catch (err: any) {
        console.error('Generation Error:', err);
        setError(err.message || 'An unexpected error occurred while generating your plan.');
      }
    }

    generateAndSave();
  }, [userId, dataString]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <HugeiconsIcon icon={AiBrain01Icon} size={80} color={Colors.accent} />
      </Animated.View>

      {!error ? (
        <Animated.View entering={FadeIn.delay(300)} exiting={FadeOut} style={styles.textContainer}>
          <Text style={styles.title}>Designing Your Blueprint</Text>
          <Text style={styles.message} key={messageIndex}>
            {LOADING_MESSAGES[messageIndex]}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Generation Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 2,
    borderColor: `${Colors.accent}30`,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: `${Colors.error}10`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  }
});
