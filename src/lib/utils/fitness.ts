export type Intensity = 'Low' | 'Medium' | 'High';
export type ExerciseType = 'Cardio' | 'Weight Lifting' | string;

/**
 * Calculates total calories burned using the Mifflin-St Jeor equation for BMR
 * combined with MET (Metabolic Equivalent of Task) values.
 */
export function calculateCaloriesBurned(
  durationMinutes: number,
  exerciseType: ExerciseType,
  intensity: Intensity,
  weightKg?: number,
  heightFeet?: number,
  birthDate?: string,
  gender?: string
): number {
  // 1. Resolve fallback biometrics
  const weight = weightKg || 70; // 70kg default
  const heightCm = heightFeet ? heightFeet * 30.48 : 170; // 170cm default
  
  let age = 30; // 30 years default
  if (birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }

  const isFemale = gender && gender.toLowerCase() === 'female';

  // 2. Calculate BMR (Mifflin-St Jeor Equation)
  // Men: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  // Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
  let bmr = 10 * weight + 6.25 * heightCm - 5 * age;
  bmr = isFemale ? bmr - 161 : bmr + 5;

  // 3. Determine MET value
  let met = 1.0;
  if (exerciseType === 'Cardio') {
    if (intensity === 'Low') met = 4.0;
    else if (intensity === 'Medium') met = 7.0;
    else if (intensity === 'High') met = 10.0;
  } else if (exerciseType === 'Weight Lifting' || exerciseType === 'Strength') {
    if (intensity === 'Low') met = 3.0;
    else if (intensity === 'Medium') met = 4.5;
    else if (intensity === 'High') met = 6.0;
  } else {
    // Generic exercise
    if (intensity === 'Low') met = 3.0;
    else if (intensity === 'Medium') met = 5.0;
    else if (intensity === 'High') met = 8.0;
  }

  // 4. Calculate Calories Burned
  const caloriesPerMinute = (bmr / 1440) * met;
  const totalCalories = caloriesPerMinute * durationMinutes;

  return Math.round(totalCalories);
}
