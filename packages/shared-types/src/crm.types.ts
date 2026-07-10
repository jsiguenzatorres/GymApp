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
  NUTRITION = 'NUTRITION',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  PENDING = 'PENDING', // solicitada por el miembro, esperando confirmación del trainer/staff
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED', // el trainer/staff rechazó la solicitud del miembro
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
  [AppointmentType.NUTRITION]: 'Nutrición',
  [AppointmentType.OTHER]: 'Otro',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Esperando confirmación',
  [AppointmentStatus.SCHEDULED]: 'Agendada',
  [AppointmentStatus.CONFIRMED]: 'Confirmada',
  [AppointmentStatus.REJECTED]: 'Rechazada',
  [AppointmentStatus.COMPLETED]: 'Completada',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.NO_SHOW]: 'No se presentó',
};
