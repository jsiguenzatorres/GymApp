import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

/**
 * Mapa muscular SVG — figura humana estilizada (vista frontal + dorsal).
 * Recibe arrays de códigos de músculos (ej: ['CHEST', 'BICEPS']) y los pinta:
 *   - primary  → rojo intenso  (#dc2626)
 *   - secondary → naranja claro (#fbbf24)
 *   - resto    → gris muy claro (#e5e7eb)
 */

const COLOR_NEUTRAL = '#e5e7eb';
const COLOR_PRIMARY = '#dc2626';
const COLOR_SECONDARY = '#fbbf24';
const COLOR_OUTLINE = '#9ca3af';

interface Props {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  size?: number; // ancho del SVG (mantiene proporción)
  showLabels?: boolean;
}

function fillFor(muscle: string, primary: Set<string>, secondary: Set<string>): string {
  if (primary.has(muscle)) return COLOR_PRIMARY;
  if (secondary.has(muscle)) return COLOR_SECONDARY;
  return COLOR_NEUTRAL;
}

export function MuscleMap({
  primaryMuscles = [],
  secondaryMuscles = [],
  size = 140,
  showLabels = true,
}: Props) {
  const primary = new Set(primaryMuscles.map((m) => m.toUpperCase()));
  const secondary = new Set(secondaryMuscles.map((m) => m.toUpperCase()));

  const colors = {
    CHEST: fillFor('CHEST', primary, secondary),
    SHOULDERS: fillFor('SHOULDERS', primary, secondary),
    BICEPS: fillFor('BICEPS', primary, secondary),
    TRICEPS: fillFor('TRICEPS', primary, secondary),
    FOREARMS: fillFor('FOREARMS', primary, secondary),
    ABS: fillFor('ABS', primary, secondary),
    QUADS: fillFor('QUADS', primary, secondary),
    HAMSTRINGS: fillFor('HAMSTRINGS', primary, secondary),
    GLUTES: fillFor('GLUTES', primary, secondary),
    CALVES: fillFor('CALVES', primary, secondary),
    BACK: fillFor('BACK', primary, secondary),
    TRAPS: fillFor('TRAPS', primary, secondary),
    NECK: fillFor('NECK', primary, secondary),
    ADDUCTORS: fillFor('ADDUCTORS', primary, secondary),
    ABDUCTORS: fillFor('ABDUCTORS', primary, secondary),
  };

  // Cada figura ocupa width/2 - margen
  const figW = size;
  const figH = size * 1.8;

  return (
    <View>
      <View style={styles.row}>
        {/* ─── VISTA FRONTAL ────────────────────────────────────────────── */}
        <View style={styles.figureCol}>
          {showLabels && <Text style={styles.label}>Frente</Text>}
          <Svg width={figW} height={figH} viewBox="0 0 100 180">
            {/* Cabeza */}
            <Circle
              cx="50"
              cy="14"
              r="9"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.6"
            />
            {/* Cuello */}
            <Path
              d="M 46 22 L 54 22 L 54 28 L 46 28 Z"
              fill={colors.NECK}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Trapecio frontal (línea superior pecho/hombros) */}
            <Path
              d="M 36 27 Q 50 22 64 27 L 62 32 L 38 32 Z"
              fill={colors.TRAPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Hombro izq (deltoide anterior) */}
            <Ellipse
              cx="33"
              cy="35"
              rx="7"
              ry="6"
              fill={colors.SHOULDERS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Hombro der */}
            <Ellipse
              cx="67"
              cy="35"
              rx="7"
              ry="6"
              fill={colors.SHOULDERS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pecho izq */}
            <Path
              d="M 38 32 Q 50 36 50 47 L 50 50 L 39 50 Q 36 42 38 32 Z"
              fill={colors.CHEST}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pecho der */}
            <Path
              d="M 62 32 Q 50 36 50 47 L 50 50 L 61 50 Q 64 42 62 32 Z"
              fill={colors.CHEST}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Abdomen */}
            <Path
              d="M 42 50 L 58 50 L 58 78 Q 50 80 42 78 Z"
              fill={colors.ABS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Bíceps izq */}
            <Ellipse
              cx="29"
              cy="48"
              rx="5"
              ry="9"
              fill={colors.BICEPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Bíceps der */}
            <Ellipse
              cx="71"
              cy="48"
              rx="5"
              ry="9"
              fill={colors.BICEPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Antebrazo izq */}
            <Ellipse
              cx="26"
              cy="65"
              rx="4.5"
              ry="9"
              fill={colors.FOREARMS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Antebrazo der */}
            <Ellipse
              cx="74"
              cy="65"
              rx="4.5"
              ry="9"
              fill={colors.FOREARMS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Mano izq */}
            <Circle
              cx="25"
              cy="78"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Mano der */}
            <Circle
              cx="75"
              cy="78"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Cadera/cintura */}
            <Path
              d="M 40 80 L 60 80 L 62 88 L 38 88 Z"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Cuádriceps izq */}
            <Path
              d="M 38 88 L 49 88 L 48 130 L 38 130 Z"
              fill={colors.QUADS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Cuádriceps der */}
            <Path
              d="M 51 88 L 62 88 L 62 130 L 52 130 Z"
              fill={colors.QUADS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Aductores (banda interna superior muslo) */}
            <Path
              d="M 49 88 L 51 88 L 51 110 L 49 110 Z"
              fill={colors.ADDUCTORS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.3"
            />
            {/* Rodillas */}
            <Circle
              cx="43"
              cy="132"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Circle
              cx="57"
              cy="132"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pantorrillas (frente: tibial — usamos calves para color) */}
            <Path
              d="M 39 135 L 47 135 L 47 165 L 40 165 Z"
              fill={colors.CALVES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Path
              d="M 53 135 L 61 135 L 60 165 L 53 165 Z"
              fill={colors.CALVES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pies */}
            <Ellipse
              cx="43"
              cy="170"
              rx="5"
              ry="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Ellipse
              cx="57"
              cy="170"
              rx="5"
              ry="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
          </Svg>
        </View>

        {/* ─── VISTA DORSAL ─────────────────────────────────────────────── */}
        <View style={styles.figureCol}>
          {showLabels && <Text style={styles.label}>Atrás</Text>}
          <Svg width={figW} height={figH} viewBox="0 0 100 180">
            {/* Cabeza */}
            <Circle
              cx="50"
              cy="14"
              r="9"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.6"
            />
            {/* Trapecio */}
            <Path
              d="M 36 24 Q 50 21 64 24 L 60 40 L 40 40 Z"
              fill={colors.TRAPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Hombros (deltoide posterior) */}
            <Ellipse
              cx="33"
              cy="35"
              rx="7"
              ry="6"
              fill={colors.SHOULDERS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Ellipse
              cx="67"
              cy="35"
              rx="7"
              ry="6"
              fill={colors.SHOULDERS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Espalda alta+media (dorsales) */}
            <Path
              d="M 38 40 L 62 40 L 60 72 L 40 72 Z"
              fill={colors.BACK}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Tríceps izq */}
            <Ellipse
              cx="29"
              cy="48"
              rx="5"
              ry="9"
              fill={colors.TRICEPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Tríceps der */}
            <Ellipse
              cx="71"
              cy="48"
              rx="5"
              ry="9"
              fill={colors.TRICEPS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Antebrazo izq */}
            <Ellipse
              cx="26"
              cy="65"
              rx="4.5"
              ry="9"
              fill={colors.FOREARMS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Antebrazo der */}
            <Ellipse
              cx="74"
              cy="65"
              rx="4.5"
              ry="9"
              fill={colors.FOREARMS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Manos */}
            <Circle
              cx="25"
              cy="78"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Circle
              cx="75"
              cy="78"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Lumbar (parte baja de la espalda — se colorea con BACK) */}
            <Path
              d="M 40 72 L 60 72 L 60 82 L 40 82 Z"
              fill={colors.BACK}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Glúteos */}
            <Path
              d="M 38 82 L 50 82 L 50 96 L 38 96 Z"
              fill={colors.GLUTES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Path
              d="M 50 82 L 62 82 L 62 96 L 50 96 Z"
              fill={colors.GLUTES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Isquiotibiales (parte trasera muslo) */}
            <Path
              d="M 38 96 L 49 96 L 48 130 L 38 130 Z"
              fill={colors.HAMSTRINGS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Path
              d="M 51 96 L 62 96 L 62 130 L 52 130 Z"
              fill={colors.HAMSTRINGS}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Rodillas (parte trasera) */}
            <Circle
              cx="43"
              cy="132"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Circle
              cx="57"
              cy="132"
              r="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pantorrillas (gastrocnemio — parte más visible atrás) */}
            <Path
              d="M 39 135 L 47 135 L 47 165 L 40 165 Z"
              fill={colors.CALVES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Path
              d="M 53 135 L 61 135 L 60 165 L 53 165 Z"
              fill={colors.CALVES}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            {/* Pies */}
            <Ellipse
              cx="43"
              cy="170"
              rx="5"
              ry="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
            <Ellipse
              cx="57"
              cy="170"
              rx="5"
              ry="3"
              fill={COLOR_NEUTRAL}
              stroke={COLOR_OUTLINE}
              strokeWidth="0.5"
            />
          </Svg>
        </View>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_PRIMARY }]} />
          <Text style={styles.legendText}>Primario</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_SECONDARY }]} />
          <Text style={styles.legendText}>Secundario</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  figureCol: { alignItems: 'center' },
  label: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: '#374151' },
});
