import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { SegmentedHalfCircleProgress30 } from './HalfProgress';
import { useRouter } from 'expo-router';

export type Macros = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  caloriesBurned?: number;
};

type Props = {
  goal: Macros;
  consumed: Macros;
};

export function CaloriesCard({ goal, consumed }: Props) {
  const router = useRouter();

  const burned = consumed.caloriesBurned || 0;
  const totalDeducted = consumed.calories + burned;
  const remainingCals = Math.max(0, goal.calories - totalDeducted);
  const remainingCarbs = Math.max(0, goal.carbs - consumed.carbs);
  const remainingProteins = Math.max(0, goal.proteins - consumed.proteins);
  const remainingFats = Math.max(0, goal.fats - consumed.fats);
  
  const progress = goal.calories > 0 ? totalDeducted / goal.calories : 0; 
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Calories</Text>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={() => router.push('/edit-goals')}>
          <Ionicons name="pencil" size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressContainer}>
        <SegmentedHalfCircleProgress30 
          progress={progress} 
          size={260} 
          strokeWidth={32} 
          segments={15} 
          gapAngle={3} 
          value={remainingCals} 
          label="Remaining" 
        />
      </View>
      
      <View style={styles.macrosContainer}>
        <View style={styles.macroBlock}>
          <MaterialCommunityIcons name="food-croissant" size={24} color="#F97316" />
          <Text style={styles.macroValue}>{remainingCarbs}g</Text>
          <Text style={styles.macroLabel}>Carbs left</Text>
        </View>
        <View style={styles.macroBlock}>
          <MaterialCommunityIcons name="fire" size={24} color="#3B82F6" />
          <Text style={styles.macroValue}>{remainingProteins}g</Text>
          <Text style={styles.macroLabel}>Protein left</Text>
        </View>
        <View style={styles.macroBlock}>
          <Ionicons name="person" size={24} color="#22C55E" />
          <Text style={styles.macroValue}>{remainingFats}g</Text>
          <Text style={styles.macroLabel}>Fats left</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  editText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
    // Add padding below so the overlay text in HalfProgress doesn't overlap macros
    paddingBottom: Spacing.xl, 
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  macroBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  macroValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
