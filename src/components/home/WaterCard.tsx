import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// We limit the layout to a single row of 9 glasses.
const MAX_GLASSES = 9;

type Props = {
  goalLiters: number;
  consumedLiters: number;
};

export function WaterCard({ goalLiters, consumedLiters }: Props) {
  const router = useRouter();

  // Protect against NaN or undefined
  const goal = goalLiters || 0;
  const consumed = consumedLiters || 0;

  // Calculate the volume represented by a single visual glass.
  const standardGlasses = goal / 0.5;
  const totalGoalGlasses = standardGlasses > MAX_GLASSES ? MAX_GLASSES : Math.ceil(standardGlasses);

  // Prevent division by zero if goal is 0
  const litersPerVisualGlass = totalGoalGlasses > 0 ? (goal / totalGoalGlasses) : 0.5;

  const fullGlasses = Math.floor(consumed / litersPerVisualGlass);
  const remainder = consumed % litersPerVisualGlass;
  const halfGlasses = remainder >= (litersPerVisualGlass / 2) ? 1 : 0;

  // Cap the visuals to our total goal
  const maxRenderedGlasses = Math.max(totalGoalGlasses, fullGlasses + halfGlasses);
  const visualTotal = Math.min(MAX_GLASSES, maxRenderedGlasses);

  const emptyGlasses = Math.max(0, visualTotal - fullGlasses - halfGlasses);

  // Progress percentage (capped at 100%)
  const progressPercent = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  // Convert to ml for display
  const consumedMl = Math.round(consumed * 1000);
  const goalMl = Math.round(goal * 1000);
  const remainingMl = Math.max(0, goalMl - consumedMl);

  // Generate array for rendering
  const renderGlasses = () => {
    const glasses = [];
    let i = 0;

    for (let f = 0; f < fullGlasses && i < MAX_GLASSES; f++) {
      glasses.push(<Image key={`full-${f}`} source={require('@/../assets/images/full_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    if (halfGlasses > 0 && i < MAX_GLASSES) {
      glasses.push(<Image key="half" source={require('@/../assets/images/half_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    for (let e = 0; e < emptyGlasses && i < MAX_GLASSES; e++) {
      glasses.push(<Image key={`empty-${e}`} source={require('@/../assets/images/empty_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    return glasses;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Water</Text>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={() => router.push('/edit-water')}>
          <Ionicons name="pencil" size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Intake stats row: Consumed | Goal | Remaining */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="water" size={14} color="#3B82F6" />
          <Text style={styles.statLabel}>Consumed</Text>
          <Text style={styles.statValue}>
            {consumedMl} <Text style={styles.statUnit}>ml</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Ionicons name="flag-outline" size={14} color={Colors.accent} />
          <Text style={styles.statLabel}>Goal</Text>
          <Text style={styles.statValue}>
            {goalMl} <Text style={styles.statUnit}>ml</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, remainingMl === 0 && { color: Colors.accent }]}>
            {remainingMl === 0 ? '✓ Done' : `${remainingMl}`}
            {remainingMl > 0 && <Text style={styles.statUnit}> ml</Text>}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>{progressPercent.toFixed(0)}% of daily goal</Text>

      {/* Glass visual grid */}
      <View style={styles.glassesContainer}>
        {renderGlasses()}
      </View>

      {/* Add Water button */}
      <TouchableOpacity style={styles.addWaterButton} activeOpacity={0.8} onPress={() => router.push('/add-water')}>
        <Ionicons name="water" size={16} color="#000" style={{ marginRight: 6 }} />
        <Text style={styles.addWaterText}>Add Water</Text>
      </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  statValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  statUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  glassIcon: {
    width: 28,
    height: 40,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  addWaterButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  addWaterText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
});
