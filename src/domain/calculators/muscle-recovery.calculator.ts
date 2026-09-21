export interface MuscleLastTrainedInput {
  muscleGroupName: string;
  muscleGroupDisplayName: string;
  lastTrainedAt: Date | null;
  totalVolumeKg?: number;
  totalSets?: number;
}

export interface MuscleRecoveryStatus {
  muscleGroupName: string;
  name: string; // Display name e.g., 'Dada (Chest)'
  hoursAgo: number;
  pct: number;
  label: string;
  isReady: boolean;
  recoveryHoursTarget: number;
}

export class MuscleRecoveryCalculator {
  /**
   * Standard recovery window (in hours) based on muscle group size & recovery physiology (Rule BR-017)
   */
  private static readonly MUSCLE_RECOVERY_HOURS: Record<string, number> = {
    CHEST: 48,
    BACK: 48,
    LEGS: 72,
    SHOULDERS: 48,
    BICEPS: 36,
    TRICEPS: 36,
    CORE: 24,
    CARDIO: 24,
    FULL_BODY: 72,
  };

  /**
   * Calculates recovery percentage and readiness status for a muscle group
   */
  static calculateRecovery(
    input: MuscleLastTrainedInput,
    referenceDate: Date = new Date(),
  ): MuscleRecoveryStatus {
    const defaultHours = 48;
    const targetHours =
      this.MUSCLE_RECOVERY_HOURS[input.muscleGroupName.toUpperCase()] || defaultHours;

    if (!input.lastTrainedAt) {
      return {
        muscleGroupName: input.muscleGroupName,
        name: input.muscleGroupDisplayName || input.muscleGroupName,
        hoursAgo: 999,
        pct: 100,
        label: 'Siap Latih',
        isReady: true,
        recoveryHoursTarget: targetHours,
      };
    }

    const lastTimeMs = new Date(input.lastTrainedAt).getTime();
    const refTimeMs = new Date(referenceDate).getTime();
    const elapsedMs = Math.max(0, refTimeMs - lastTimeMs);
    const hoursAgo = Math.floor(elapsedMs / (1000 * 60 * 60));

    // Calculate percentage (0% to 100%)
    const rawPct = Math.min(100, Math.round((hoursAgo / targetHours) * 100));
    const pct = Math.max(0, rawPct);

    let label = 'Siap Latih';
    let isReady = false;

    if (pct >= 95) {
      label = 'Pulih Total';
      isReady = true;
    } else if (pct >= 80) {
      label = 'Hampir Pulih';
      isReady = true;
    } else if (pct >= 50) {
      label = 'Sedang Pulih';
      isReady = false;
    } else {
      label = 'Pemulihan Awal';
      isReady = false;
    }

    return {
      muscleGroupName: input.muscleGroupName,
      name: input.muscleGroupDisplayName || input.muscleGroupName,
      hoursAgo,
      pct,
      label,
      isReady,
      recoveryHoursTarget: targetHours,
    };
  }

  /**
   * Calculates recovery for all standard muscle groups
   */
  static calculateAll(
    inputs: MuscleLastTrainedInput[],
    referenceDate: Date = new Date(),
  ): MuscleRecoveryStatus[] {
    return inputs.map((input) => this.calculateRecovery(input, referenceDate));
  }
}
