import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useUser } from '@clerk/expo';
import { useDateContext } from '@/context/DateContext';

const getEndOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Week starts on Monday:
  // Mon (1) -> +6 days = Sun
  // Tue (2) -> +5 days = Sun
  // Sun (0) -> +0 days = Sun
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const generateDates = (joinDateInput?: any) => {
  let startDate = new Date();
  if (joinDateInput) {
    startDate = new Date(joinDateInput);
    // Fallback if invalid date
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
    }
  } else {
    // Fallback to 14 days ago if not logged in yet
    startDate.setDate(startDate.getDate() - 14);
  }
  startDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Failsafe: start date shouldn't be in the future
  if (startDate > today) {
    startDate = new Date(today);
  }

  const endDate = getEndOfWeek(today);
  
  const dates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export function DateStrip() {
  const { user } = useUser();
  
  // useMemo ensures dates array only recalculates if the join date changes
  const dates = useMemo(() => generateDates(user?.createdAt), [user?.createdAt]);

  const { selectedDate, setSelectedDate } = useDateContext();
  
  const flatListRef = useRef<FlatList>(null);

  // Calculate today's index to center it in the list
  const initialScrollIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const idx = dates.findIndex(d => d.getTime() === today.getTime());
    return idx !== -1 ? idx : Math.max(0, dates.length - 1);
  }, [dates]);

  // Ensure FlatList scrolls to today if dates change asynchronously
  useEffect(() => {
    if (dates.length > 0 && flatListRef.current) {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ 
            index: initialScrollIndex, 
            animated: true, 
            viewPosition: 0.5 
          });
        } catch (e) {
          // Ignore layout scroll errors
        }
      }, 500);
    }
  }, [dates, initialScrollIndex]);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const renderItem = ({ item }: { item: Date }) => {
    const isSelected = isSameDay(item, selectedDate);
    const isToday = isSameDay(item, new Date());
    
    const dayString = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][item.getDay()];
    const dateString = item.getDate().toString();

    return (
      <TouchableOpacity 
        style={[styles.pill, isSelected && styles.pillSelected]} 
        onPress={() => setSelectedDate(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
          {dayString}
        </Text>
        <View style={[styles.circle, isSelected && styles.circleSelected]}>
          <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
            {dateString}
          </Text>
        </View>
        
        {/* A tiny dot to indicate "Today" if it is not currently selected */}
        {isToday && !isSelected && <View style={styles.todayIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        keyExtractor={(item) => item.toISOString()}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={initialScrollIndex}
        getItemLayout={(data, index) => (
          { length: 56 + Spacing.sm, offset: (56 + Spacing.sm) * index, index }
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm, // Gap between pills
  },
  pill: {
    width: 56,
    height: 100, // Tall pill shape
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dayText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    marginTop: 8,
  },
  dayTextSelected: {
    color: Colors.background, // Dark text on the bright green pill
    fontWeight: FontWeight.bold,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: {
    backgroundColor: '#FFFFFF', // Bright white circle inside the selected pill
  },
  dateText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  dateTextSelected: {
    color: Colors.background, // Dark text inside the white circle
  },
  todayIndicator: {
    position: 'absolute',
    top: 6,
    right: 24, // Centered
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  }
});
