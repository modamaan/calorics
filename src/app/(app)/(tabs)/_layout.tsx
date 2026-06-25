import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Alert, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeOutDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rotation = useSharedValue(0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    rotation.value = withSpring(isMenuOpen ? 0 : 45, { damping: 12, stiffness: 200 });
  };

  const closeMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      rotation.value = withSpring(0, { damping: 12, stiffness: 200 });
    }
  };

  const handleAction = (action: string) => {
    closeMenu();
    if (action === 'food') {
      router.push('/add-meal');
    } else if (action === 'water') {
      router.push('/edit-water');
    } else if (action === 'exercise') {
      router.push('/log-exercise');
    } else if (action === 'scan') {
      Alert.alert('Premium Feature', 'Upgrade to Calorics Premium to scan your food with AI!');
    }
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <>
      {/* Full screen backdrop when menu is open */}
      {isMenuOpen && (
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={closeMenu}
        />
      )}

      {/* Action Menu Overlay */}
      {isMenuOpen && (
        <Animated.View 
          entering={FadeInDown.duration(200)} 
          exiting={FadeOutDown.duration(200)}
          style={styles.actionMenuContainer}
        >
          <View style={styles.gridContainer}>
            {/* Row 1 */}
            <TouchableOpacity style={styles.gridItem} onPress={() => handleAction('exercise')} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="barbell" size={24} color="#EF4444" />
              </View>
              <Text style={styles.gridLabel}>Log Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => handleAction('water')} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="water" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.gridLabel}>Add Water</Text>
            </TouchableOpacity>

            {/* Row 2 */}
            <TouchableOpacity style={styles.gridItem} onPress={() => handleAction('food')} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="restaurant" size={24} color="#22C55E" />
              </View>
              <Text style={styles.gridLabel}>Food Database</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridItem, { opacity: 0.5 }]} onPress={() => handleAction('scan')} activeOpacity={0.7}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color="#000" />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                <Ionicons name="scan" size={24} color="#EAB308" />
              </View>
              <Text style={styles.gridLabel}>Scan Food</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <View style={styles.tabBarWrapper}>
        {/* The Curved Pill for regular tabs */}
        <View style={styles.pillContainer}>
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
          
          {state.routes.map((route: any, index: number) => {
            if (route.name === 'action') return null;

            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              closeMenu(); // Close menu if switching tabs
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Map route names to icons
            let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
            if (route.name === 'home') {
              iconName = isFocused ? 'home' : 'home-outline';
            } else if (route.name === 'analytics') {
              iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'profile') {
              iconName = isFocused ? 'person' : 'person-outline';
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? Colors.textPrimary : Colors.textMuted} 
                />
                {/* Little dot underneath the active tab */}
                {isFocused && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* The + Action Button completely separated on the right end */}
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={toggleMenu}
        >
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="add" size={32} color={Colors.background} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="action" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: 32,
    marginRight: Spacing.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionMenuContainer: {
    position: 'absolute',
    bottom: 110, // Just above the FAB
    right: Spacing.xl,
    width: width * 0.75, // 75% of screen width
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 100, // Ensure it floats above everything
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', 
    marginBottom: Spacing.md,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gridLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
    zIndex: 10,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  }
});
