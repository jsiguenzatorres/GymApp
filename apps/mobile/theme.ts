import {
  THEME_DARK,
  THEME_LIGHT,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  ANIMATION,
} from '@gymapp/shared-types';
import type { AppTheme } from '@gymapp/shared-types';

export { THEME_LIGHT, THEME_DARK, TYPOGRAPHY, SPACING, RADIUS, ANIMATION };
export type { AppTheme };

/**
 * Acceso rápido al theme activo.
 * Sustituir por useColorScheme() en producción (Sprint 1.1).
 */
export const theme = THEME_LIGHT;
