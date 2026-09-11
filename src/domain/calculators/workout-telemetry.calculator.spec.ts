import { WorkoutTelemetryCalculator } from './workout-telemetry.calculator';

describe('WorkoutTelemetryCalculator', () => {
  it('should accurately calculate session telemetry for resistance training according to PRD formulas', () => {
    const startedAt = new Date('2026-09-10T18:00:00.000Z');
    const completedAt = new Date('2026-09-10T19:00:00.000Z'); // 60 mins = 3600 secs

    const ex1End = new Date('2026-09-10T18:25:00.000Z');
    const ex2Start = new Date('2026-09-10T18:28:00.000Z'); // 3 mins transition = 180 secs

    const exercises = [
      {
        startedAt,
        completedAt: ex1End,
        sets: [
          { durationSeconds: 45, restSeconds: 90, weightKg: 60, reps: 10, isCompleted: true },
          { durationSeconds: 42, restSeconds: 90, weightKg: 60, reps: 10, isCompleted: true },
          { durationSeconds: 40, restSeconds: 0, weightKg: 60, reps: 8, isCompleted: true },
        ],
      },
      {
        startedAt: ex2Start,
        completedAt,
        sets: [
          { durationSeconds: 50, restSeconds: 90, weightKg: 50, reps: 12, isCompleted: true },
          { durationSeconds: 45, restSeconds: 0, weightKg: 50, reps: 10, isCompleted: true },
        ],
      },
    ];

    const result = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises,
      userWeightKg: 70,
    });

    expect(result.sessionDurationSeconds).toBe(3600);
    // Active: 45 + 42 + 40 + 50 + 45 = 222
    expect(result.activeDurationSeconds).toBe(222);
    // Rest: 90 + 90 + 0 + 90 + 0 = 270
    expect(result.restDurationSeconds).toBe(270);
    // Transition: 180
    expect(result.transitionDurationSeconds).toBe(180);
    // Tracked: 222 + 270 + 180 = 672
    expect(result.trackedDurationSeconds).toBe(672);
    // Idle: 3600 - 672 = 2928
    expect(result.idleDurationSeconds).toBe(2928);
    // Active Ratio: (222 / 3600) * 100 = 6.2%
    expect(result.activeRatioPct).toBe(6.2);
    // Density: (222 / (222 + 270)) * 100 = (222 / 492) * 100 = 45.1%
    expect(result.densityPct).toBe(45.1);
    // Volume: (60*10) + (60*10) + (60*8) + (50*12) + (50*10) = 600 + 600 + 480 + 600 + 500 = 2780 kg
    expect(result.totalVolumeKg).toBe(2780);
    // Calories burned > 0
    expect(result.estimatedCaloriesBurned).toBeGreaterThan(0);
    expect(result.resistanceCalories).toBeGreaterThan(0);
  });

  it('should accurately calculate cardio treadmill calories using ACSM formulas', () => {
    const startedAt = new Date('2026-09-10T18:00:00.000Z');
    const completedAt = new Date('2026-09-10T18:30:00.000Z'); // 30 mins = 1800 secs

    const exercises = [
      {
        startedAt,
        completedAt,
        isCardio: true,
        sets: [
          {
            durationSeconds: 1800, // 30 mins
            restSeconds: 0,
            isCompleted: true,
            isCardio: true,
            speedKmh: 4.8,
            inclinePct: 0,
          },
        ],
      },
    ];

    const result = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises,
      userWeightKg: 70,
    });

    expect(result.sessionDurationSeconds).toBe(1800);
    expect(result.activeDurationSeconds).toBe(1800);
    expect(result.cardioCalories).toBeGreaterThan(100);
    expect(result.estimatedCaloriesBurned).toBe(result.cardioCalories);
  });

  it('should scale resistance calories proportionally with lifting tonnage and active duration (Intensity Scaling)', () => {
    const startedAt = new Date('2026-09-10T18:00:00.000Z');
    const completedAt = new Date('2026-09-10T18:45:00.000Z');

    // Case A: Low intensity (Light weights, low volume: 20kg x 10 reps = 200kg, 20s per set)
    const lowIntensity = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises: [
        {
          sets: [
            { durationSeconds: 20, restSeconds: 60, weightKg: 20, reps: 10, isCompleted: true },
            { durationSeconds: 20, restSeconds: 60, weightKg: 20, reps: 10, isCompleted: true },
          ],
        },
      ],
      userWeightKg: 70,
    });

    // Case B: High intensity (Heavy weights, high volume: 100kg x 10 reps = 1,000kg, 45s per set)
    const highIntensity = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises: [
        {
          sets: [
            { durationSeconds: 45, restSeconds: 60, weightKg: 100, reps: 10, isCompleted: true },
            { durationSeconds: 45, restSeconds: 60, weightKg: 100, reps: 10, isCompleted: true },
          ],
        },
      ],
      userWeightKg: 70,
    });

    // High intensity must burn strictly more calories than low intensity
    expect(highIntensity.totalVolumeKg).toBeGreaterThan(lowIntensity.totalVolumeKg);
    expect(highIntensity.activeDurationSeconds).toBeGreaterThan(lowIntensity.activeDurationSeconds);
    expect(highIntensity.estimatedCaloriesBurned).toBeGreaterThan(lowIntensity.estimatedCaloriesBurned);
  });

  it('should scale cardio calories proportionally with speed and incline intensity (ACSM equation)', () => {
    const startedAt = new Date('2026-09-10T18:00:00.000Z');
    const completedAt = new Date('2026-09-10T18:30:00.000Z'); // 30 mins

    // Case 1: Low intensity walk (Speed 4 km/h, Flat 0% incline)
    const lowCardio = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises: [
        {
          isCardio: true,
          sets: [{ durationSeconds: 1800, restSeconds: 0, speedKmh: 4.0, inclinePct: 0, isCompleted: true }],
        },
      ],
      userWeightKg: 70,
    });

    // Case 2: Moderate intensity incline walk (Speed 5 km/h, 8% incline)
    const medCardio = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises: [
        {
          isCardio: true,
          sets: [{ durationSeconds: 1800, restSeconds: 0, speedKmh: 5.0, inclinePct: 8, isCompleted: true }],
        },
      ],
      userWeightKg: 70,
    });

    // Case 3: High intensity running on incline (Speed 10 km/h, 5% incline)
    const highCardio = WorkoutTelemetryCalculator.calculateSessionTelemetry({
      startedAt,
      completedAt,
      exercises: [
        {
          isCardio: true,
          sets: [{ durationSeconds: 1800, restSeconds: 0, speedKmh: 10.0, inclinePct: 5, isCompleted: true }],
        },
      ],
      userWeightKg: 70,
    });

    // Verify hierarchical intensity progression
    expect(medCardio.cardioCalories).toBeGreaterThan(lowCardio.cardioCalories);
    expect(highCardio.cardioCalories).toBeGreaterThan(medCardio.cardioCalories);
  });

  it('should scale calorie expenditure relative to user body mass', () => {
    const startedAt = new Date('2026-09-10T18:00:00.000Z');
    const completedAt = new Date('2026-09-10T18:30:00.000Z');

    const workout = {
      startedAt,
      completedAt,
      exercises: [
        {
          sets: [
            { durationSeconds: 40, restSeconds: 60, weightKg: 80, reps: 10, isCompleted: true },
            { durationSeconds: 40, restSeconds: 60, weightKg: 80, reps: 10, isCompleted: true },
          ],
        },
      ],
    };

    const lightUser = WorkoutTelemetryCalculator.calculateSessionTelemetry({ ...workout, userWeightKg: 55 });
    const heavyUser = WorkoutTelemetryCalculator.calculateSessionTelemetry({ ...workout, userWeightKg: 90 });

    expect(heavyUser.estimatedCaloriesBurned).toBeGreaterThan(lightUser.estimatedCaloriesBurned);
  });
});
