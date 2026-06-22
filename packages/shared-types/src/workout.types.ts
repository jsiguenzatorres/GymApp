export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  FOREARMS = 'FOREARMS',
  QUADS = 'QUADS',
  HAMSTRINGS = 'HAMSTRINGS',
  GLUTES = 'GLUTES',
  CALVES = 'CALVES',
  ABS = 'ABS',
  FULL_BODY = 'FULL_BODY',
}

export enum Equipment {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  MACHINE = 'MACHINE',
  CABLE = 'CABLE',
  BODYWEIGHT = 'BODYWEIGHT',
  KETTLEBELL = 'KETTLEBELL',
  BANDS = 'BANDS',
  OTHER = 'OTHER',
}

export enum ExerciseCategory {
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO',
  FLEXIBILITY = 'FLEXIBILITY',
  PLYOMETRIC = 'PLYOMETRIC',
}

export enum WorkoutGoal {
  STRENGTH = 'STRENGTH',
  HYPERTROPHY = 'HYPERTROPHY',
  ENDURANCE = 'ENDURANCE',
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  ATHLETIC = 'ATHLETIC',
  GENERAL_FITNESS = 'GENERAL_FITNESS',
}

export enum BlockType {
  STANDARD = 'STANDARD',
  WARMUP = 'WARMUP',
  SUPERSET = 'SUPERSET',
  GIANT_SET = 'GIANT_SET',
  CIRCUIT = 'CIRCUIT',
  EMOM = 'EMOM',
  AMRAP = 'AMRAP',
  TABATA = 'TABATA',
  DROP_SET = 'DROP_SET',
  PYRAMID = 'PYRAMID',
  REST_PAUSE = 'REST_PAUSE',
  COOLDOWN = 'COOLDOWN',
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  [MuscleGroup.CHEST]: 'Pecho',
  [MuscleGroup.BACK]: 'Espalda',
  [MuscleGroup.SHOULDERS]: 'Hombros',
  [MuscleGroup.BICEPS]: 'Bíceps',
  [MuscleGroup.TRICEPS]: 'Tríceps',
  [MuscleGroup.FOREARMS]: 'Antebrazos',
  [MuscleGroup.QUADS]: 'Cuádriceps',
  [MuscleGroup.HAMSTRINGS]: 'Isquiotibiales',
  [MuscleGroup.GLUTES]: 'Glúteos',
  [MuscleGroup.CALVES]: 'Pantorrillas',
  [MuscleGroup.ABS]: 'Abdominales',
  [MuscleGroup.FULL_BODY]: 'Cuerpo completo',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  [Equipment.BARBELL]: 'Barra',
  [Equipment.DUMBBELL]: 'Mancuernas',
  [Equipment.MACHINE]: 'Máquina',
  [Equipment.CABLE]: 'Cable / Polea',
  [Equipment.BODYWEIGHT]: 'Peso corporal',
  [Equipment.KETTLEBELL]: 'Kettlebell',
  [Equipment.BANDS]: 'Bandas elásticas',
  [Equipment.OTHER]: 'Otro',
};

export const WORKOUT_GOAL_LABELS: Record<WorkoutGoal, string> = {
  [WorkoutGoal.STRENGTH]: 'Fuerza',
  [WorkoutGoal.HYPERTROPHY]: 'Hipertrofia',
  [WorkoutGoal.ENDURANCE]: 'Resistencia',
  [WorkoutGoal.WEIGHT_LOSS]: 'Pérdida de peso',
  [WorkoutGoal.ATHLETIC]: 'Rendimiento atlético',
  [WorkoutGoal.GENERAL_FITNESS]: 'Fitness general',
};

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  [ExerciseCategory.STRENGTH]: 'Fuerza',
  [ExerciseCategory.CARDIO]: 'Cardio',
  [ExerciseCategory.FLEXIBILITY]: 'Flexibilidad',
  [ExerciseCategory.PLYOMETRIC]: 'Pliométrico',
};
