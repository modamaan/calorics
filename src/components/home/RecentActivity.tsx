import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLog, getActivities } from '@/lib/api/firestore';
import { useAuth } from '@clerk/expo';
import { useDateContext } from '@/context/DateContext';
import { useFocusEffect } from 'expo-router';

export function RecentActivity() {
  const { userId } = useAuth();
  const { selectedDate } = useDateContext();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    if (!userId) return;
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const fetchedActivities = await getActivities(userId, dateStr);
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    // Firebase timestamp has toDate()
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getExerciseIcon = (exerciseType?: string) => {
    const type = exerciseType?.toLowerCase() || '';
    if (type.includes('weight') || type.includes('strength')) return 'barbell';
    if (type.includes('cardio') || type.includes('run') || type.includes('walk')) return 'walk';
    if (type.includes('cycle') || type.includes('bike')) return 'bicycle';
    return 'flame';
  };

  const renderActivityCard = (activity: ActivityLog) => {
    if (activity.type === 'exercise') {
      return (
        <View key={activity.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name={getExerciseIcon(activity.title)} size={28} color={Colors.accent} />
            </View>
          </View>
          
          <View style={styles.cardMiddle}>
            <Text style={styles.activityTitle}>{activity.title || 'Workout'}</Text>
            
            <View style={styles.caloriesRow}>
              <Ionicons name="flame" size={14} color="#EF4444" />
              <Text style={styles.caloriesText}>{activity.calories || 0} Cals Burned</Text>
            </View>
            
            {/* Only show intensity and duration if they exist (not for manual entries) */}
            {(activity.intensity || activity.duration) && (
              <Text style={styles.detailsText}>
                {activity.intensity ? `${activity.intensity} Intensity` : ''}
                {activity.intensity && activity.duration ? ' • ' : ''}
                {activity.duration ? `${activity.duration} mins` : ''}
              </Text>
            )}
          </View>
          
          <View style={styles.cardRight}>
            <Text style={styles.timeText}>{formatTime(activity.timestamp)}</Text>
          </View>
        </View>
      );
    }

    // Default fallback for other types (meals, water)
    return (
      <View key={activity.id} style={styles.card}>
        <Text style={styles.activityTitle}>{activity.title || activity.type}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>

      {loading && activities.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      ) : activities.length > 0 ? (
        <View style={styles.listContainer}>
          {activities.map(renderActivityCard)}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No activities logged yet</Text>
          <Text style={styles.emptySubtitle}>
            Track your meals and workouts to see your progress here!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listContainer: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(57, 255, 20, 0.1)', // Subtle accent background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  caloriesText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  detailsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    height: '100%',
    paddingTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  emptyStateContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
