import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@clerk/expo';
import { getDailyLog, logWater } from '@/lib/api/firestore';
import { useDateContext } from '@/context/DateContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

const LITERS_PER_GLASS = 0.5;

export default function EditWaterModal() {
  const router = useRouter();
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // We track local uncommitted state to show the user how much they are adding/removing
  const [adjustmentGlasses, setAdjustmentGlasses] = useState(0);

  const handleSave = async () => {
    if (!userId || adjustmentGlasses === 0) {
      router.back();
      return;
    }

    try {
      setSaving(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const amountLiters = adjustmentGlasses * LITERS_PER_GLASS;
      
      await logWater(userId, dateStr, amountLiters);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not log water.");
      setSaving(false);
    }
  };

  const addGlass = () => setAdjustmentGlasses(prev => prev + 1);
  const removeGlass = () => setAdjustmentGlasses(prev => prev - 1);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const isAdding = adjustmentGlasses > 0;
  const isRemoving = adjustmentGlasses < 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Water</Text>
        <Text style={styles.subtitle}>
          Date: {selectedDate.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.content}>
        
        <View style={styles.adjusterContainer}>
          <TouchableOpacity 
            style={[styles.adjustButton, { backgroundColor: 'rgba(255, 60, 60, 0.1)', borderColor: Colors.error }]} 
            onPress={removeGlass}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={28} color={Colors.error} />
          </TouchableOpacity>
          
          <View style={styles.displayContainer}>
            <Image source={require('@/../assets/images/full_glass.png')} style={styles.mainGlass} />
            <Text style={styles.adjustmentText}>
              {adjustmentGlasses > 0 ? '+' : ''}{adjustmentGlasses} 
            </Text>
            <Text style={styles.unitText}>Glasses</Text>
          </View>

          <TouchableOpacity 
            style={[styles.adjustButton, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' }]} 
            onPress={addGlass}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          1 Glass = 500ml
        </Text>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, adjustmentGlasses === 0 && { opacity: 0.5 }]} 
          onPress={handleSave} 
          disabled={saving || adjustmentGlasses === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>
            {saving ? 'Saving...' : `Save ${isAdding ? '+' : ''}${adjustmentGlasses * 500}ml`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()} 
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: Spacing.xxl,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjusterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  adjustButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayContainer: {
    alignItems: 'center',
  },
  mainGlass: {
    width: 60,
    height: 80,
    resizeMode: 'contain',
    marginBottom: Spacing.md,
  },
  adjustmentText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  unitText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  helperText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
  saveButton: {
    backgroundColor: '#3B82F6', // Blue for water
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.textPrimary,
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
