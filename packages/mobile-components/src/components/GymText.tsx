import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface GymTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const variantStyles: Record<NonNullable<GymTextProps['variant']>, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15 },
  caption: { fontSize: 12, color: '#6b7280' },
  label: { fontSize: 13, fontWeight: '500' },
};

export function GymText({ variant = 'body', style, children }: GymTextProps) {
  return <Text style={[variantStyles[variant], style]}>{children}</Text>;
}
