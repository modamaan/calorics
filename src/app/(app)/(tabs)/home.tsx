import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateStrip } from '@/components/home/DateStrip';
import { CaloriesCard } from '@/components/home/CaloriesCard';
import { WaterCard } from '@/components/home/WaterCard';
import { RecentActivity } from '@/components/home/RecentActivity';
import { useFocusEffect } from 'expo-router';
import { getUserProfile, getDailyLog } from '@/lib/api/firestore';
import { useDateContext } from '@/context/DateContext';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const displayName = user?.firstName ?? user?.username;
  const profileImage = user?.imageUrl;

  const [goals, setGoals] = useState({ calories: 0, proteins: 0, carbs: 0, fats: 0, water: 0 });
  const [consumed, setConsumed] = useState({ calories: 0, proteins: 0, carbs: 0, fats: 0, water: 0, caloriesBurned: 0 });
  const { selectedDate } = useDateContext();

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      
      const loadData = async () => {
        try {
          const profile = await getUserProfile(user.id);
          if (profile?.fitnessPlan) {
            setGoals({
              calories: profile.fitnessPlan.dailyCalories,
              proteins: profile.fitnessPlan.proteins,
              carbs: profile.fitnessPlan.carbs,
              fats: profile.fitnessPlan.fats,
              water: profile.fitnessPlan.waterIntake || 0,
            });
          }

          const dateStr = selectedDate.toISOString().split('T')[0];
          const log = await getDailyLog(user.id, dateStr);
          if (log) {
            setConsumed({
              calories: log.calories || 0,
              proteins: log.proteins || 0,
              carbs: log.carbs || 0,
              fats: log.fats || 0,
              water: log.water || 0,
              caloriesBurned: log.caloriesBurned || 0,
            });
          } else {
            setConsumed({ calories: 0, proteins: 0, carbs: 0, fats: 0, water: 0, caloriesBurned: 0 });
          }
        } catch (e) {
          console.error(e);
        }
      };

      loadData();
    }, [user?.id, selectedDate])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Outline Header matching the requested design */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={20} color="rgba(255,255,255,0.5)" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.nameText}>{displayName}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </Animated.View>

        {/* Date Strip Component */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <DateStrip />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.content}>
          <CaloriesCard goal={goals} consumed={consumed} />
          <WaterCard goalLiters={goals.water} consumedLiters={consumed.water} />
          
          <RecentActivity />
          
          {/* Dev Sign Out */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={async () => {
                if (user) {
                  await AsyncStorage.removeItem(`onboardingComplete_${user.id}`);
                }
                signOut();
              }}
            >
              <Text style={styles.signOutText}>Sign Out (Dev)</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120, // Extra padding for the floating bottom nav bar
    gap: Spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent, // Glowing neon green dot
    borderWidth: 1.5,
    borderColor: Colors.background, // Creates a nice cutout effect against the background
  },
  content: {
    flex: 1,
    gap: Spacing.lg,
  },
  placeholderCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: Spacing.md,
  },
  placeholderTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  placeholderSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  signOutButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
