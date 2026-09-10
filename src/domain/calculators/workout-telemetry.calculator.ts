export interface TelemetrySetInput {
  durationSeconds: number;
  restSeconds: number;
  weightKg?: number;
  reps?: number;
  isCompleted?: boolean;
  isCardio?: boolean;
  inclinePct?: number;
  speedKmh?: number;
}

export interface TelemetryExerciseInput {
  startedAt?: Date | null;
  completedAt?: Date | null;
  isCardio?: boolean;
  sets: TelemetrySetInput[];
}

export interface SessionTelemetryInput {
  startedAt: Date;
  completedAt?: Date | null;
  exercises: TelemetryExerciseInput[];
  userWeightKg?: number;
}

export interface TelemetryResult {
  sessionDurationSeconds: number;
  activeDurationSeconds: number;
  restDurationSeconds: number;
  transitionDurationSeconds: number;
  idleDurationSeconds: number;
  trackedDurationSeconds: number;
  activeRatioPct: number;
  densityPct: number;
  totalVolumeKg: number;
  estimatedCaloriesBurned: number;
  resistanceCalories: number;
  cardioCalories: number;
}

export class WorkoutTelemetryCalculator {
  /**
   * Calculates comprehensive session duration, active/rest/transition breakdown, ratios, and calories burned
   * PRD Sections 18 - 26, 32 - 35, and 133
   */
  static calculateSessionTelemetry(input: SessionTelemetryInput): TelemetryResult {
    const startMs = new Date(input.startedAt).getTime();
    const endMs = input.completedAt ? new Date(input.completedAt).getTime() : Date.now();
    const sessionDurationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

    let activeDurationSeconds = 0;
    let restDurationSeconds = 0;
    let transitionDurationSeconds = 0;
    let totalVolumeKg = 0;
    let cardioActiveSeconds = 0;
    let cardioCaloriesTotal = 0;

    const weight = Math.max(30, Number(input.userWeightKg) || 70);
    const exercises = Array.isArray(input.exercises) ? input.exercises : [];

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const isExerciseCardio = !!ex.isCardio;

      // Sum active & rest durations and evaluate set metrics
      if (Array.isArray(ex.sets)) {
        for (const s of ex.sets) {
          if (s.isCompleted !== false) {
            const setDuration = Math.max(0, Number(s.durationSeconds) || 0);
            const setRest = Math.max(0, Number(s.restSeconds) || 0);
            const isSetCardio = isExerciseCardio || !!s.isCardio;

            activeDurationSeconds += setDuration;
            restDurationSeconds += setRest;

            if (isSetCardio) {
              cardioActiveSeconds += setDuration;
              const speedKmh = Math.max(0, Number(s.speedKmh) || 4.8);
              const inclinePct = Math.max(0, Number(s.inclinePct) || 0);
              const durationMinutes = setDuration > 0 ? setDuration / 60 : 30;

              // ACSM Metabolic Equation for Treadmill (PRD Section 34.2 & 133.3)
              const speedMpm = speedKmh * 16.667;
              const inclineFrac = inclinePct / 100;
              let vo2 = 3.5;

              if (speedKmh <= 6.0) {
                // Walking / Incline Walk
                vo2 = (0.1 * speedMpm) + (1.8 * speedMpm * inclineFrac) + 3.5;
              } else {
                // Running
                vo2 = (0.2 * speedMpm) + (0.9 * speedMpm * inclineFrac) + 3.5;
              }

              const cardioCal = ((vo2 * weight) / 200) * durationMinutes;
              cardioCaloriesTotal += cardioCal;
            } else {
              const w = Math.max(0, Number(s.weightKg) || 0);
              const r = Math.max(0, Number(s.reps) || 0);
              totalVolumeKg += w * r;
            }
          }
        }
      }

      // Transition time between consecutive exercises (PRD Section 21)
      if (i > 0 && ex.startedAt && exercises[i - 1].completedAt) {
        const prevEndMs = new Date(exercises[i - 1].completedAt!).getTime();
        const currStartMs = new Date(ex.startedAt!).getTime();
        if (currStartMs > prevEndMs) {
          transitionDurationSeconds += Math.floor((currStartMs - prevEndMs) / 1000);
        }
      }
    }

    const trackedDurationSeconds =
      activeDurationSeconds + restDurationSeconds + transitionDurationSeconds;

    const idleDurationSeconds = Math.max(
      0,
      sessionDurationSeconds - trackedDurationSeconds,
    );

    const activeRatioPct =
      sessionDurationSeconds > 0
        ? Math.round((activeDurationSeconds / sessionDurationSeconds) * 1000) / 10
        : 0;

    const workRestTotal = activeDurationSeconds + restDurationSeconds;
    const densityPct =
      workRestTotal > 0
        ? Math.round((activeDurationSeconds / workRestTotal) * 1000) / 10
        : 0;

    // Resistance Training Calorie Formulation (PRD Section 34.1)
    const resistanceActiveSeconds = Math.max(0, activeDurationSeconds - cardioActiveSeconds);
    const calActive = ((5.5 * 3.5 * weight) / 200) * (resistanceActiveSeconds / 60);
    const calRest = ((1.5 * 3.5 * weight) / 200) * (restDurationSeconds / 60);
    const calVolume = totalVolumeKg * 0.0005; // 0.5 kcal per 1,000 kg tonnage bonus
    const resistanceCaloriesTotal = calActive + calRest + calVolume;

    // Final Unified Session Calories (PRD Section 34.3)
    const estimatedCaloriesBurned = Math.max(
      0,
      Math.round(resistanceCaloriesTotal + cardioCaloriesTotal),
    );

    return {
      sessionDurationSeconds,
      activeDurationSeconds,
      restDurationSeconds,
      transitionDurationSeconds,
      idleDurationSeconds,
      trackedDurationSeconds,
      activeRatioPct,
      densityPct,
      totalVolumeKg,
      estimatedCaloriesBurned,
      resistanceCalories: Math.round(resistanceCaloriesTotal),
      cardioCalories: Math.round(cardioCaloriesTotal),
    };
  }
}
