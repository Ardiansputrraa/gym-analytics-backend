import { WorkoutVolumeCalculator } from './workout-volume.calculator';

describe('WorkoutVolumeCalculator', () => {
  describe('calculateSetVolume', () => {
    it('should correctly calculate volume for valid weight and reps', () => {
      expect(WorkoutVolumeCalculator.calculateSetVolume(60, 10)).toBe(600);
      expect(WorkoutVolumeCalculator.calculateSetVolume(82.5, 8)).toBe(660);
      expect(WorkoutVolumeCalculator.calculateSetVolume(100, 1)).toBe(100);
    });

    it('should return 0 for bodyweight exercise (0 kg)', () => {
      expect(WorkoutVolumeCalculator.calculateSetVolume(0, 15)).toBe(0);
    });

    it('should handle 0 reps or negative values gracefully', () => {
      expect(WorkoutVolumeCalculator.calculateSetVolume(60, 0)).toBe(0);
      expect(WorkoutVolumeCalculator.calculateSetVolume(-10, 10)).toBe(0);
      expect(WorkoutVolumeCalculator.calculateSetVolume(60, -5)).toBe(0);
    });
  });

  describe('calculateTotalVolume', () => {
    it('should aggregate volume across multiple completed sets', () => {
      const sets = [
        { weightKg: 60, reps: 10, isCompleted: true },
        { weightKg: 60, reps: 10, isCompleted: true },
        { weightKg: 60, reps: 8, isCompleted: true },
      ];
      // 600 + 600 + 480 = 1680 (PRD Section 28 Example)
      expect(WorkoutVolumeCalculator.calculateTotalVolume(sets)).toBe(1680);
    });

    it('should ignore uncompleted sets when isCompleted is false', () => {
      const sets = [
        { weightKg: 80, reps: 5, isCompleted: true },
        { weightKg: 80, reps: 5, isCompleted: false },
      ];
      expect(WorkoutVolumeCalculator.calculateTotalVolume(sets)).toBe(400);
    });

    it('should return 0 for empty sets array', () => {
      expect(WorkoutVolumeCalculator.calculateTotalVolume([])).toBe(0);
    });
  });
});
