import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@clerk/expo';
import { useDateContext } from '@/context/DateContext';
import { logExercise } from '@/lib/api/firestore';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

export default function WorkoutResultsScreen() {
  const router = useRouter();
  const { caloriesBurned, exerciseType, duration, intensity } = useLocalSearchParams<{
    caloriesBurned: string;
    exerciseType: string;
    duration: string;
    intensity: string;
  }>();
  
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();
  
  const [loading, setLoading] = useState(false);
  
  const burnedAmount = parseInt(caloriesBurned || '0', 10);
  const type = exerciseType || 'Workout';

  const handleLogWorkout = async () => {
    if (!userId) return;
    
    if (burnedAmount <= 0) {
      Alert.alert('Error', 'No calories were burned during this workout.');
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      await logExercise(
        userId, 
        dateStr, 
        burnedAmount, 
        type, 
        `${type} Workout`, 
        intensity, 
        parseInt(duration || '0', 10)
      );
      
      router.dismissAll();
      router.replace('/home');
    } catch (error) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(800).springify()} style={styles.iconContainer}>
          <View style={styles.fireCircle}>
            <Image 
              source={require('@/../assets/images/fire.png')} 
              style={styles.fireIcon} 
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.textContainer}>
          <Text style={styles.titleText}>Your Workout Burned</Text>
          <Text style={styles.caloriesText}>{burnedAmount} <Text style={styles.caloriesUnit}>Cals</Text></Text>
          <Text style={styles.subtitleText}>{duration} mins of {type}</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.logButton} 
          activeOpacity={0.8} 
          onPress={handleLogWorkout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.logButtonText}>Log Workout</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  fireCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fireIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontWeight: FontWeight.medium,
  },
  caloriesText: {
    fontSize: 64,
    fontWeight: 'bold', // Avoid 900 on Android just in case
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  caloriesUnit: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  subtitleText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  bottomContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  logButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
