// GymApp opera en una sola zona horaria por ahora (America/El_Salvador,
// UTC-6, sin horario de verano). Las fechas se guardan en la convención
// "hora de pared de El Salvador, escrita con sufijo Z" (ver CLAUDE.md /
// convención del calendario de agenda) — nunca se hace conversión real de
// timezone. gymNow() da el instante actual en esa misma convención, para
// poder comparar contra columnas de fecha existentes sin desalinear 6h.
const EL_SALVADOR_OFFSET_MS = 6 * 60 * 60 * 1000;

export function gymNow(): Date {
  return new Date(Date.now() - EL_SALVADOR_OFFSET_MS);
}

export function startOfGymDay(date: Date = gymNow()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfGymDay(date: Date = gymNow()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function startOfGymMonth(date: Date = gymNow()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfGymMonth(date: Date = gymNow()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

// weekStartsOn: 0 = domingo, 1 = lunes. Devuelve el inicio (00:00) de la
// semana que contiene `date`, en convención gym-time (getters UTC).
export function startOfGymWeek(date: Date = gymNow(), weekStartsOn: 0 | 1 = 0): Date {
  const d = startOfGymDay(date);
  const currentDay = d.getUTCDay();
  const diff = weekStartsOn === 1 ? (currentDay + 6) % 7 : currentDay;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
