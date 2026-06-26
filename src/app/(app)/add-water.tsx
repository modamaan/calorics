import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useDateContext } from '@/context/DateContext';
import { logWater } from '@/lib/api/firestore';

// Each tap = 250ml = 0.25L (half a glass where 1 glass = 500ml)
const HALF_GLASS_ML = 250;
const HALF_GLASS_LITERS = 0.25;
// Max display: 4 full glasses = 8 half glasses
const MAX_HALF_GLASSES = 8;

export default function AddWaterScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();

  const [halfGlasses, setHalfGlasses] = useState(0); // count in half-glass units
  const [loading, setLoading] = useState(false);

  const totalMl = halfGlasses * HALF_GLASS_ML;
  const totalLiters = halfGlasses * HALF_GLASS_LITERS;

  const handleAdd = () => {
    if (halfGlasses < MAX_HALF_GLASSES) {
      setHalfGlasses((prev) => prev + 1);
    }
  };

  const handleRemove = () => {
    if (halfGlasses > 0) {
      setHalfGlasses((prev) => prev - 1);
    }
  };

  const handleLog = async () => {
    if (!userId || totalLiters === 0) return;
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await logWater(userId, dateStr, totalLiters);
      router.back();
    } catch (err) {
      console.error('Error logging water:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build the glass visualization
  // halfGlasses tells us how many half-units the user has added.
  // Each "slot" represents one full glass (2 half-glass units).
  // We display up to 4 full glass slots.
  const renderGlasses = () => {
    const slots = [];
    for (let i = 0; i < 4; i++) {
      const filledHalves = halfGlasses - i * 2; // how many halves in this slot
      let source;
      if (filledHalves <= 0) {
        source = require('@/../assets/images/empty_glass.png');
      } else if (filledHalves === 1) {
        source = require('@/../assets/images/half_glass.png');
      } else {
        source = require('@/../assets/images/full_glass.png');
      }
      slots.push(
        <Animated.Image
          key={i}
          entering={FadeIn.duration(300).delay(i * 60)}
          source={source}
          style={styles.glassImage}
          resizeMode="contain"
        />
      );
    }
    return slots;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <Animated.Text entering={FadeInDown.duration(400).delay(50)} style={styles.heading}>
          Add Water Intake
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.subheading}>
          Track your hydration by tapping the + button
        </Animated.Text>

        {/* Glass Grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.glassGrid}>
          {renderGlasses()}
        </Animated.View>

        {/* Amount display + controls */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, halfGlasses === 0 && styles.controlButtonDisabled]}
            onPress={handleRemove}
            activeOpacity={0.7}
            disabled={halfGlasses === 0}
          >
            <Ionicons name="remove" size={26} color={halfGlasses === 0 ? Colors.textMuted : Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{totalMl}</Text>
            <Text style={styles.amountUnit}>ml</Text>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, halfGlasses === MAX_HALF_GLASSES && styles.controlButtonDisabled]}
            onPress={handleAdd}
            activeOpacity={0.7}
            disabled={halfGlasses === MAX_HALF_GLASSES}
          >
            <Ionicons name="add" size={26} color={halfGlasses === MAX_HALF_GLASSES ? Colors.textMuted : Colors.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* Progress text */}
        <Animated.Text entering={FadeInDown.duration(400).delay(300)} style={styles.progressText}>
          {halfGlasses === 0
            ? 'Tap + to start adding water'
            : `${totalLiters.toFixed(2)}L · ${halfGlasses} of ${MAX_HALF_GLASSES} half glasses`}
        </Animated.Text>
      </ScrollView>

      {/* Log Button */}
      <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.logButton, (totalLiters === 0 || loading) && styles.logButtonDisabled]}
          onPress={handleLog}
          activeOpacity={0.8}
          disabled={totalLiters === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="water" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.logButtonText}>Log Water</Text>
            </>
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
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    flexGrow: 1,
  },
  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  subheading: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  glassImage: {
    width: 64,
    height: 100,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  amountContainer: {
    alignItems: 'center',
    minWidth: 110,
  },
  amountText: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 54,
  },
  amountUnit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  logButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonDisabled: {
    opacity: 0.35,
  },
  logButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
});
