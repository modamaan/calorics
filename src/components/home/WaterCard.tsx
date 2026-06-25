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
  // If the standard 500ml glass calculation exceeds 9 glasses, we dynamically scale 
  // the glasses so the entire goal fits perfectly into 9 visual glasses.
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
  
  // Remaining visual glasses
  const remainingGlasses = Math.max(0, totalGoalGlasses - fullGlasses - halfGlasses);

  // Generate array for rendering
  const renderGlasses = () => {
    const glasses = [];
    let i = 0;

    // Add full glasses
    for (let f = 0; f < fullGlasses && i < MAX_GLASSES; f++) {
      glasses.push(<Image key={`full-${f}`} source={require('@/../assets/images/full_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    // Add half glass
    if (halfGlasses > 0 && i < MAX_GLASSES) {
      glasses.push(<Image key="half" source={require('@/../assets/images/half_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    // Add empty glasses
    for (let e = 0; e < emptyGlasses && i < MAX_GLASSES; e++) {
      glasses.push(<Image key={`empty-${e}`} source={require('@/../assets/images/empty_glass.png')} style={styles.glassIcon} />);
      i++;
    }

    return glasses;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Water</Text>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={() => router.push('/edit-water')}>
          <Ionicons name="pencil" size={14} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.glassesContainer}>
        {renderGlasses()}
      </View>

      <Text style={styles.remainingText}>
        {remainingGlasses} glasses remaining
      </Text>
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
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  glassIcon: {
    width: 28,
    height: 40,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  remainingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  }
});
