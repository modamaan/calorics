import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useDateContext } from '@/context/DateContext';
import { useAuth } from '@clerk/expo';
import { logMeal } from '@/lib/api/firestore';

export default function AddMealModal() {
  const router = useRouter();
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();

  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!userId) return;
    
    const cal = parseInt(calories, 10) || 0;
    const pro = parseInt(proteins, 10) || 0;
    const car = parseInt(carbs, 10) || 0;
    const fat = parseInt(fats, 10) || 0;

    if (cal === 0 && pro === 0 && car === 0 && fat === 0) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await logMeal(userId, dateStr, { calories: cal, proteins: pro, carbs: car, fats: fat });
      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const dateStrDisplay = selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Log Macros</Text>
        <Text style={styles.subtitle}>{dateStrDisplay}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calories (kcal)</Text>
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
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Log'}</Text>
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
    color: Colors.accent,
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
