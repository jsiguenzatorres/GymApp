import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';

interface GymCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function GymCard({ style, children }: GymCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
