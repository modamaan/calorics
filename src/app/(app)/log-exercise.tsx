import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogExerciseScreen() {
  const router = useRouter();

  const handleOptionPress = (option: string) => {
    if (option === 'Cardio' || option === 'Weight Lifting') {
      router.push(`/log-exercise-details?type=${encodeURIComponent(option)}`);
    } else if (option === 'Manual Entry') {
      router.push('/log-manual-exercise');
    } else {
      Alert.alert('Coming Soon', `The ${option} logging workflow will be available in a future update.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Exercise</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Run / Cardio Option */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.8}
          onPress={() => handleOptionPress('Cardio')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="walk" size={28} color="#EF4444" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Run</Text>
            <Text style={styles.cardDescription}>
              Track calories burned through running, walking, cycling, and other cardio activities.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Weight Lifting Option */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.8}
          onPress={() => handleOptionPress('Weight Lifting')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="barbell" size={28} color="#3B82F6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Weight Lifting</Text>
            <Text style={styles.cardDescription}>
              Log calories burned from gym workouts, weight training, machines, and strength exercises.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Manual Option */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.8}
          onPress={() => handleOptionPress('Manual Entry')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Ionicons name="calculator" size={28} color="#22C55E" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Manual</Text>
            <Text style={styles.cardDescription}>
              Enter calories burned manually without selecting a specific activity.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

      </ScrollView>
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
    width: 32, // Matches back button width to center title perfectly
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
