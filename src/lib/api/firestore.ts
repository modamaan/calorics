/**
 * Firestore service — user profile CRUD operations.
 * All database logic lives here, not in screens.
 */

import { doc, setDoc, getDoc, serverTimestamp, FieldValue, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: 'email' | 'google';
  onboardingComplete?: boolean;
  fitnessPlan?: FitnessPlan;
  createdAt: FieldValue;
}

export interface FitnessPlan {
  dailyCalories: number;
  proteins: number;
  carbs: number;
  fats: number;
  waterIntake: number;
  planSummary: string;
  fitnessTips: string[];
}

export interface OnboardingData {
  gender: 'Male' | 'Female' | 'Other';
  goal: 'Gain Weight' | 'Lose Weight' | 'Maintain Weight';
  workoutDays: '2-3 Days' | '3-4 Days' | '5-6 Days';
  birthDate: Date;
  heightFeet: number;
  weightKg: number;
}

/**
 * Creates or updates a user document in Firestore under users/{uid}.
 * Uses merge:true so partial updates don't wipe existing fields.
 */
export async function saveUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt'>,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      uid,
      ...data,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Saves onboarding data to the user's profile and marks onboarding as complete.
 */
export async function saveOnboardingData(uid: string, data: OnboardingData): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      onboardingComplete: true,
      onboardingData: data,
    },
    { merge: true }
  );
}

/**
 * Fetches the user profile from Firestore to check onboarding status.
 */
export async function getUserProfile(uid: string) {
  // First try direct document ID
  let userRef = doc(db, 'users', uid);
  let snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  
  // Fallback: search by uid field in case document ID is auto-generated
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uid', '==', uid));
  const querySnap = await getDocs(q);
  
  if (!querySnap.empty) {
    return querySnap.docs[0].data();
  }
  
  return null;
}

/**
 * Saves generated AI fitness plan to user profile.
 */
export async function saveFitnessPlan(uid: string, plan: Partial<FitnessPlan>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    { fitnessPlan: plan },
    { merge: true }
  );
}

export interface DailyLog {
  dateStr: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  water: number;
  caloriesBurned?: number;
  lastUpdated?: FieldValue;
}

export interface ActivityLog {
  id: string;
  type: 'meal' | 'water' | 'exercise';
  title?: string;
  calories?: number;
  waterAmount?: number;
  intensity?: string;
  duration?: number;
  timestamp: Date | any; // Firebase Timestamp
}

/**
 * Fetches the aggregated log for a specific date (YYYY-MM-DD)
 */
export async function getDailyLog(uid: string, dateStr: string): Promise<DailyLog | null> {
  const logRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
  const snap = await getDoc(logRef);
  if (snap.exists()) {
    return snap.data() as DailyLog;
  }
  return null;
}

/**
 * Increments the macros for a specific day.
 */
export async function logMeal(
  uid: string, 
  dateStr: string, 
  macros: { calories: number; proteins: number; carbs: number; fats: number }
): Promise<void> {
  const logRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
  
  await setDoc(logRef, {
    dateStr,
    calories: increment(macros.calories),
    proteins: increment(macros.proteins),
    carbs: increment(macros.carbs),
    fats: increment(macros.fats),
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

/**
 * Increments the water intake for a specific day.
 */
export async function logWater(
  uid: string, 
  dateStr: string, 
  amountLiters: number
): Promise<void> {
  const logRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
  
  await setDoc(logRef, {
    dateStr,
    water: increment(amountLiters),
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

/**
 * Logs an exercise activity and increments calories burned for the day.
 */
export async function logExercise(
  uid: string,
  dateStr: string,
  caloriesBurned: number,
  type: string,
  title: string,
  intensity?: string,
  duration?: number
): Promise<void> {
  const logRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
  const activitiesRef = collection(db, 'users', uid, 'dailyLogs', dateStr, 'activities');

  // Increment daily calories burned
  await setDoc(logRef, {
    dateStr,
    caloriesBurned: increment(caloriesBurned),
    lastUpdated: serverTimestamp()
  }, { merge: true });

  // Add the specific activity to the subcollection
  await setDoc(doc(activitiesRef), {
    type: 'exercise',
    exerciseType: type,
    title: title,
    calories: caloriesBurned,
    ...(intensity && { intensity }),
    ...(duration && { duration }),
    timestamp: serverTimestamp()
  });
}

/**
 * Fetches the activities for a specific day.
 */
export async function getActivities(uid: string, dateStr: string): Promise<ActivityLog[]> {
  const activitiesRef = collection(db, 'users', uid, 'dailyLogs', dateStr, 'activities');
  // Order by timestamp descending (newest first) if possible. Since it's empty for now, basic query is fine.
  const snap = await getDocs(activitiesRef);
  if (snap.empty) {
    return [];
  }
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ActivityLog[];
}
