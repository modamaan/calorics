import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const SIZES = {
  sm: { logo: 52, title: FontSize.xl, tagline: FontSize.sm },
  md: { logo: 72, title: FontSize.xxl, tagline: FontSize.md },
  lg: { logo: 96, title: FontSize.xxxl, tagline: FontSize.lg },
};

export function AppLogo({ size = 'md', showTagline = true }: AppLogoProps) {
  const dims = SIZES[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/calorics_logo.png')}
        style={[styles.logo, { width: dims.logo, height: dims.logo }]}
        contentFit="contain"
        transition={300}
      />
      <Text style={[styles.title, { fontSize: dims.title }]}>Calorics</Text>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: dims.tagline }]}>
          AI-Powered Calorie Tracker
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logo: {
    borderRadius: 20,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.3,
  },
});
