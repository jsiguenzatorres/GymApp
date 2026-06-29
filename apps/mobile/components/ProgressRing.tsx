import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  /** Texto grande dentro del anillo (ej: "78%") */
  centerText?: string;
  /** Subtexto pequeño debajo (ej: "Plata") */
  centerSub?: string;
  /** Emoji a la izquierda del centerText (ej: "🥈") */
  centerEmoji?: string;
}

export function ProgressRing({
  progress,
  size = 84,
  strokeWidth = 7,
  color = '#1d4ed8',
  bgColor = '#e5e7eb',
  centerText,
  centerSub,
  centerEmoji,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - clamped);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {centerEmoji && <Text style={styles.emoji}>{centerEmoji}</Text>}
        {centerText && <Text style={styles.text}>{centerText}</Text>}
        {centerSub && <Text style={styles.sub}>{centerSub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  center: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 18 },
  text: { fontSize: 14, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 9, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
});
