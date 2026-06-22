export enum InteractionType {
  CALL = 'CALL',
  MESSAGE = 'MESSAGE',
  VISIT = 'VISIT',
  NOTE = 'NOTE',
  COMPLAINT = 'COMPLAINT',
  EMAIL = 'EMAIL',
  APPOINTMENT = 'APPOINTMENT',
}

export enum InteractionChannel {
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  IN_PERSON = 'IN_PERSON',
  APP = 'APP',
  TELEGRAM = 'TELEGRAM',
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export enum InteractionOutcome {
  RESOLVED = 'RESOLVED',
  PENDING = 'PENDING',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  TRAINING = 'TRAINING',
  EVALUATION = 'EVALUATION',
  FOLLOW_UP = 'FOLLOW_UP',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  [InteractionType.CALL]: 'Llamada',
  [InteractionType.MESSAGE]: 'Mensaje',
  [InteractionType.VISIT]: 'Visita',
  [InteractionType.NOTE]: 'Nota interna',
  [InteractionType.COMPLAINT]: 'Queja / Reclamo',
  [InteractionType.EMAIL]: 'Email',
  [InteractionType.APPOINTMENT]: 'Cita',
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'Consulta',
  [AppointmentType.TRAINING]: 'Sesión de entrenamiento',
  [AppointmentType.EVALUATION]: 'Evaluación física',
  [AppointmentType.FOLLOW_UP]: 'Seguimiento',
  [AppointmentType.OTHER]: 'Otro',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Agendada',
  [AppointmentStatus.CONFIRMED]: 'Confirmada',
  [AppointmentStatus.COMPLETED]: 'Completada',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.NO_SHOW]: 'No se presentó',
};
