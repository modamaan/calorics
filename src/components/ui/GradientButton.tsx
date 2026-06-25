import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

export function GradientButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  variant = 'primary',
}: GradientButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressed.value, [0, 1], [1, 0.97], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.85], Extrapolation.CLAMP),
  }));

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: 80 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 150 });
  }, [pressed]);

  const isPrimary = variant === 'primary';

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      activeOpacity={1}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        (disabled || isLoading) && styles.disabledButton,
        isPrimary ? Shadow.accent : {},
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isPrimary ? Colors.textOnAccent : Colors.accent}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.55,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: Colors.textOnAccent,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
});
