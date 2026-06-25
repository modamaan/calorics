import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@clerk/expo';
import { getUserProfile, saveFitnessPlan } from '@/lib/api/firestore';

export default function EditGoalsModal() {
  const router = useRouter();
  const { userId } = useAuth();

  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCurrentGoals() {
      if (!userId) return;
      try {
        const profile = await getUserProfile(userId);
        if (profile?.fitnessPlan) {
          setCalories(profile.fitnessPlan.dailyCalories.toString());
          setProteins(profile.fitnessPlan.proteins.toString());
          setCarbs(profile.fitnessPlan.carbs.toString());
          setFats(profile.fitnessPlan.fats.toString());
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCurrentGoals();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    const cal = parseInt(calories, 10);
    const pro = parseInt(proteins, 10);
    const car = parseInt(carbs, 10);
    const fat = parseInt(fats, 10);

    if (isNaN(cal) || isNaN(pro) || isNaN(car) || isNaN(fat)) {
      Alert.alert("Invalid Input", "Please enter valid numbers for all fields.");
      return;
    }

    try {
      setSaving(true);
      await saveFitnessPlan(userId, {
        dailyCalories: cal,
        proteins: pro,
        carbs: car,
        fats: fat,
        // Preserve other properties like waterIntake and fitnessTips if they exist, 
        // saveFitnessPlan uses merge: true so it won't overwrite them!
        waterIntake: 3.5, // Fallback if missing
        fitnessTips: [] // Fallback if missing
      });
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save your fitness goals.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Edit Daily Goals</Text>
        <Text style={styles.subtitle}>Update your target nutrition</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Daily Calories (kcal)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={calories}
            onChangeText={setCalories}
          />
        </View>

        <View style={styles.macroRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={proteins}
              onChangeText={setProteins}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginHorizontal: Spacing.sm }]}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.label}>Fats (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={fats}
              onChangeText={setFats}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Update Goals'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.xl,
    paddingTop: 60,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  cancelButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  }
});
