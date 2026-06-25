import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import Animated, { useAnimatedStyle, withTiming, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { saveOnboardingData, OnboardingData } from '@/lib/api/firestore';
import { GradientButton } from '@/components/ui/GradientButton';

import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  UserCircleIcon, 
  Target02Icon, 
  Dumbbell01Icon, 
  Calendar01Icon, 
  RulerIcon 
} from '@hugeicons/core-free-icons';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [gender, setGender] = useState<OnboardingData['gender'] | null>(null);
  const [goal, setGoal] = useState<OnboardingData['goal'] | null>(null);
  const [workoutDays, setWorkoutDays] = useState<OnboardingData['workoutDays'] | null>(null);
  
  // Birthdate State
  const [bDay, setBDay] = useState('');
  const [bMonth, setBMonth] = useState('');
  const [bYear, setBYear] = useState('');

  // Metrics State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Progress bar animation
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${(step / TOTAL_STEPS) * 100}%`, { duration: 300 }),
    };
  });

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      if (!userId) return;
      setIsSubmitting(true);
      try {
        const data: OnboardingData = {
          gender: gender!,
          goal: goal!,
          workoutDays: workoutDays!,
          birthDate: new Date(Number(bYear), Number(bMonth) - 1, Number(bDay)),
          heightFeet: parseFloat(height),
          weightKg: parseFloat(weight),
        };

        // Navigate to generation screen and pass the serialized data
        router.push({
          pathname: '/(app)/generating-plan',
          params: { data: JSON.stringify(data) }
        });
      } catch (err) {
        console.error('Navigation error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !gender) return true;
    if (step === 2 && !goal) return true;
    if (step === 3 && !workoutDays) return true;
    if (step === 4 && (!bDay || !bMonth || !bYear || bYear.length !== 4)) return true;
    if (step === 5 && (!height || !weight)) return true;
    return false;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
        <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={UserCircleIcon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>What's your gender?</Text>
            <Text style={styles.subtitle}>This helps us calculate your specific caloric needs accurately.</Text>
            
            <View style={styles.optionsContainer}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.optionCard, gender === option && styles.optionCardSelected]}
                  onPress={() => setGender(option as any)}
                >
                  <Text style={[styles.optionText, gender === option && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={Target02Icon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>What's your main goal?</Text>
            
            <View style={styles.optionsContainer}>
              {['Lose Weight', 'Maintain Weight', 'Gain Weight'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.optionCard, goal === option && styles.optionCardSelected]}
                  onPress={() => setGoal(option as any)}
                >
                  <Text style={[styles.optionText, goal === option && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={Dumbbell01Icon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>How often do you workout?</Text>
            
            <View style={styles.optionsContainer}>
              {['2-3 Days', '3-4 Days', '5-6 Days'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.optionCard, workoutDays === option && styles.optionCardSelected]}
                  onPress={() => setWorkoutDays(option as any)}
                >
                  <Text style={[styles.optionText, workoutDays === option && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={Calendar01Icon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>When were you born?</Text>
            
            <View style={styles.dateContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.inputLabel}>DD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="01"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={bDay}
                  onChangeText={setBDay}
                />
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.inputLabel}>MM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={bMonth}
                  onChangeText={setBMonth}
                />
              </View>
              <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>YYYY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1990"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={bYear}
                  onChangeText={setBYear}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {step === 5 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <HugeiconsIcon icon={RulerIcon} size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>What are your current metrics?</Text>
            
            <View style={styles.metricsContainer}>
              <View style={styles.metricInputWrapper}>
                <Text style={styles.inputLabel}>Height (Feet)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5.9"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={styles.metricInputWrapper}>
                <Text style={styles.inputLabel}>Weight (Kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 75"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton 
          label={step === TOTAL_STEPS ? "Finish" : "Next Step"} 
          onPress={handleNext} 
          disabled={isNextDisabled() || isSubmitting}
          isLoading={isSubmitting}
        />
        {step > 1 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setStep(step - 1)}
            disabled={isSubmitting}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}10`,
  },
  optionText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    color: Colors.accent,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
  },
  metricsContainer: {
    gap: Spacing.lg,
  },
  metricInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    padding: Spacing.md,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
