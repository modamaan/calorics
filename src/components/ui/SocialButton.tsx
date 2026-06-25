import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Inline Google "G" SVG as text emoji substitute — works without svg library
function GoogleIcon() {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

interface SocialButtonProps {
  provider: 'google';
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const PROVIDER_CONFIG = {
  google: {
    label: 'Continue with Google',
    color: '#DB4437',
    bgColor: 'rgba(219, 68, 55, 0.08)',
    borderColor: 'rgba(219, 68, 55, 0.25)',
  },
} as const;

export function SocialButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: SocialButtonProps) {
  const pressed = useSharedValue(0);
  const config = PROVIDER_CONFIG[provider];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressed.value, [0, 1], [1, 0.97], Extrapolation.CLAMP),
      },
    ],
  }));

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: 80 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 150 });
  }, [pressed]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      activeOpacity={1}
      style={[
        styles.button,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        (disabled || isLoading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={config.label}
    >
      {isLoading ? (
        <ActivityIndicator color={config.color} size="small" />
      ) : (
        <>
          <GoogleIcon />
          <Text style={[styles.label, { color: Colors.textPrimary }]}>
            {config.label}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: '#DB4437',
    lineHeight: 15,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});
