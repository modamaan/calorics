import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuth } from '@clerk/expo';
import { getUserProfile } from '@/lib/api/firestore';
import { calculateCaloriesBurned } from '@/lib/utils/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Intensity = 'Low' | 'Medium' | 'High';

export default function LogExerciseDetailsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { userId } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      getUserProfile(userId).then(profile => {
        if (profile?.onboardingData) {
          setProfileData(profile.onboardingData);
        }
      });
    }
  }, [userId]);
  
  const exerciseType = type || 'Exercise';
  const description = exerciseType === 'Cardio' 
    ? 'Track calories burned through running, walking, cycling, and other cardio activities.' 
    : 'Log calories burned from gym workouts, weight training, machines, and strength exercises.';

  // Intensity State
  const intensities: Intensity[] = ['Low', 'Medium', 'High'];
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>('Medium');
  
  // Animated slider value
  const sliderWidth = SCREEN_WIDTH - (Spacing.xl * 2) - (Spacing.lg * 2); // Screen minus padding minus inner card padding
  const segmentWidth = sliderWidth / 3;
  const translateX = useSharedValue(segmentWidth); // Defaults to 'Medium'

  useEffect(() => {
    const index = intensities.indexOf(selectedIntensity);
    translateX.value = withSpring(index * segmentWidth, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [selectedIntensity]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Duration State
  const durationChips = [15, 30, 60, 90];
  const [selectedDuration, setSelectedDuration] = useState<number | null>(30);
  const [manualDuration, setManualDuration] = useState<string>('');

  const handleChipSelect = (minutes: number) => {
    setSelectedDuration(minutes);
    setManualDuration(''); // Clear manual input when a chip is selected
  };

  const handleManualInput = (text: string) => {
    setManualDuration(text);
    if (text.length > 0) {
      setSelectedDuration(null); // Clear chip selection when typing manually
    } else {
      setSelectedDuration(30); // Default back if cleared
    }
  };

  const handleContinue = () => {
    const finalDuration = selectedDuration || parseInt(manualDuration) || 0;
    
    if (finalDuration <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    const burned = calculateCaloriesBurned(
      finalDuration,
      exerciseType,
      selectedIntensity,
      profileData?.weightKg,
      profileData?.heightFeet,
      profileData?.birthDate,
      profileData?.gender
    );

    router.push({
      pathname: '/workout-results',
      params: { 
        caloriesBurned: burned,
        exerciseType: exerciseType,
        duration: finalDuration,
        intensity: selectedIntensity
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exerciseType}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          
          <Text style={styles.descriptionText}>{description}</Text>

          {/* Intensity Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Intensity</Text>
            
            <View style={styles.sliderBackground}>
              {/* Animated active pill */}
              <Animated.View style={[styles.sliderActivePill, { width: segmentWidth }, animatedIndicatorStyle]} />
              
              {/* Segments (Buttons) */}
              {intensities.map((intensity, index) => {
                const isActive = selectedIntensity === intensity;
                return (
                  <TouchableOpacity 
                    key={intensity} 
                    style={[styles.sliderSegment, { width: segmentWidth }]}
                    onPress={() => setSelectedIntensity(intensity)}
                    activeOpacity={1}
                  >
                    <Text style={[styles.sliderText, isActive && styles.sliderTextActive]}>
                      {intensity}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Duration (minutes)</Text>
            
            {/* Chips */}
            <View style={styles.chipsContainer}>
              {durationChips.map(minutes => {
                const isActive = selectedDuration === minutes;
                return (
                  <TouchableOpacity 
                    key={minutes}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => handleChipSelect(minutes)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {minutes} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Manual Input */}
            <Text style={styles.inputLabel}>Or enter custom duration:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 45"
                placeholderTextColor={Colors.textMuted}
                value={manualDuration}
                onChangeText={handleManualInput}
                maxLength={3}
              />
              <Text style={styles.inputUnit}>min</Text>
            </View>
          </View>

        </ScrollView>

        {/* Bottom Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.continueButton} activeOpacity={0.8} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 32, 
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  descriptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  
  // Custom Slider Styles
  sliderBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.full,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  sliderActivePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  sliderSegment: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Stay above the animated pill
  },
  sliderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  sliderTextActive: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
  },

  // Chips Styles
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  chip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },

  // Manual Input Styles
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    paddingVertical: Spacing.md,
    fontWeight: FontWeight.medium,
  },
  inputUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
  },

  // Bottom Container
  bottomContainer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  continueButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  continueText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
