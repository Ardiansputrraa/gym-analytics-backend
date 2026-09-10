import { RecordType } from '../enums/workout.enums';

export interface ExistingPR {
  exerciseId: string;
  recordType: RecordType;
  value: number;
}

export interface NewSetCandidate {
  setId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  isCompleted?: boolean;
}

export interface DetectedPR {
  exerciseId: string;
  workoutSetId: string;
  recordType: RecordType;
  value: number;
  previousValue: number;
}

export class PersonalRecordEngine {
  /**
   * Evaluates sets from a workout against user's historical PR records
   * and returns newly broken Personal Records (Weight PR, Rep PR, Volume PR).
   * PRD Section 31
   */
  static evaluateNewRecords(
    sets: NewSetCandidate[],
    existingPRs: ExistingPR[],
  ): DetectedPR[] {
    if (!Array.isArray(sets) || sets.length === 0) return [];

    const detected: DetectedPR[] = [];

    // Map existing PRs for fast lookup: `${exerciseId}:${recordType}` -> value
    const prMap = new Map<string, number>();
    for (const pr of existingPRs) {
      prMap.set(`${pr.exerciseId}:${pr.recordType}`, Number(pr.value) || 0);
    }

    for (const s of sets) {
      if (s.isCompleted === false) continue;

      const weight = Math.max(0, Number(s.weightKg) || 0);
      const reps = Math.max(0, Number(s.reps) || 0);
      if (reps === 0) continue;

      const setVolume = Math.round(weight * reps * 1000) / 1000;

      // 1. Check Max Weight PR (only if weight > 0)
      if (weight > 0) {
        const keyWeight = `${s.exerciseId}:${RecordType.MAX_WEIGHT}`;
        const currentMaxWeight = prMap.get(keyWeight) || 0;
        if (weight > currentMaxWeight) {
          detected.push({
            exerciseId: s.exerciseId,
            workoutSetId: s.setId,
            recordType: RecordType.MAX_WEIGHT,
            value: weight,
            previousValue: currentMaxWeight,
          });
          prMap.set(keyWeight, weight); // Update in-memory for subsequent sets in same session
        }
      }

      // 2. Check Max Reps PR
      const keyReps = `${s.exerciseId}:${RecordType.MAX_REPS}`;
      const currentMaxReps = prMap.get(keyReps) || 0;
      if (reps > currentMaxReps) {
        detected.push({
          exerciseId: s.exerciseId,
          workoutSetId: s.setId,
          recordType: RecordType.MAX_REPS,
          value: reps,
          previousValue: currentMaxReps,
        });
        prMap.set(keyReps, reps);
      }

      // 3. Check Max Volume PR (Set Volume)
      if (setVolume > 0) {
        const keyVolume = `${s.exerciseId}:${RecordType.MAX_VOLUME}`;
        const currentMaxVolume = prMap.get(keyVolume) || 0;
        if (setVolume > currentMaxVolume) {
          detected.push({
            exerciseId: s.exerciseId,
            workoutSetId: s.setId,
            recordType: RecordType.MAX_VOLUME,
            value: setVolume,
            previousValue: currentMaxVolume,
          });
          prMap.set(keyVolume, setVolume);
        }
      }
    }

    return detected;
  }
}
