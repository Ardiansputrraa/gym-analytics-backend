export interface SetVolumeInput {
  weightKg: number;
  reps: number;
  isCompleted?: boolean;
}

export class WorkoutVolumeCalculator {
  /**
   * Calculates volume for an individual set (Weight kg x Reps)
   * PRD Section 28: Volume = Weight x Reps
   */
  static calculateSetVolume(weightKg: number, reps: number): number {
    const validWeight = Math.max(0, Number(weightKg) || 0);
    const validReps = Math.max(0, Number(reps) || 0);
    return Math.round(validWeight * validReps * 1000) / 1000;
  }

  /**
   * Calculates total volume for a list of sets
   * PRD Section 28: Total Volume = Σ(Weight x Reps)
   */
  static calculateTotalVolume(sets: SetVolumeInput[]): number {
    if (!Array.isArray(sets) || sets.length === 0) return 0;

    const total = sets.reduce((acc, set) => {
      // If isCompleted is explicitly false, do not count toward volume
      if (set.isCompleted === false) return acc;
      return acc + this.calculateSetVolume(set.weightKg, set.reps);
    }, 0);

    return Math.round(total * 1000) / 1000;
  }
}
