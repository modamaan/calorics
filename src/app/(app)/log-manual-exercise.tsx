import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useDateContext } from '@/context/DateContext';
import { logExercise } from '@/lib/api/firestore';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogManualExerciseScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();

  const [calories, setCalories] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!userId) return;

    const burned = parseInt(calories, 10);

    if (isNaN(burned) || burned <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number for calories burned.');
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Log the exercise into Firebase
      await logExercise(userId, dateStr, burned, 'Manual', 'Manual Entry');

      // Route back to home where they can see the updated Recent Activity
      router.dismissAll();
      router.replace('/home');

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save your activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manual Calories Burn</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >

          {/* Visual Header */}
          <View style={styles.illustrationContainer}>
            <View style={styles.fireCircle}>
              <Image source={require('@/../assets/images/fire.png')} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
            </View>
          </View>

          <Text style={styles.descriptionText}>
            Manually log the number of calories you've burned during an activity or workout to accurately track your daily deficit.
          </Text>

          {/* Input Card */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Calories Burned</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 350"
                placeholderTextColor={Colors.textMuted}
                value={calories}
                onChangeText={setCalories}
                maxLength={4}
                autoFocus
              />
              <Text style={styles.inputUnit}>cal</Text>
            </View>
          </View>

        </ScrollView>

        {/* Bottom Save Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.saveButton, (!calories || loading) && styles.saveButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!calories || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.saveText}>Save Calories</Text>
            )}
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
    fontSize: FontSize.lg,
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
    paddingBottom: 250, // Massive padding to ensure the input can scroll way up
    alignItems: 'center',
  },
  illustrationContainer: {
    marginVertical: Spacing.xxl,
    alignItems: 'center',
  },
  fireCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Subtle red glow
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  descriptionText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  inputCard: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  textInput: {
    color: Colors.textPrimary,
    fontSize: 56, // Massive input
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    minWidth: 120,
  },
  inputUnit: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 12, // Align with the bottom of the large numbers
    marginLeft: Spacing.sm,
  },
  bottomContainer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
