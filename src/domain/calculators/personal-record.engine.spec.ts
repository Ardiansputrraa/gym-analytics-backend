import { PersonalRecordEngine } from './personal-record.engine';
import { RecordType } from '../enums/workout.enums';

describe('PersonalRecordEngine', () => {
  it('should detect new Max Weight, Max Reps, and Max Volume PRs', () => {
    const exerciseId = 'ex-bench-press';
    const existingPRs = [
      { exerciseId, recordType: RecordType.MAX_WEIGHT, value: 80 },
      { exerciseId, recordType: RecordType.MAX_REPS, value: 10 },
      { exerciseId, recordType: RecordType.MAX_VOLUME, value: 800 },
    ];

    const sets = [
      { setId: 'set-1', exerciseId, weightKg: 85, reps: 8, isCompleted: true }, // Weight PR: 85 > 80
      { setId: 'set-2', exerciseId, weightKg: 70, reps: 15, isCompleted: true }, // Rep PR: 15 > 10, Volume PR: 1050 > 800
      { setId: 'set-3', exerciseId, weightKg: 60, reps: 10, isCompleted: true }, // No PR
    ];

    const newRecords = PersonalRecordEngine.evaluateNewRecords(sets, existingPRs);

    expect(newRecords.length).toBe(3);

    const weightPR = newRecords.find((r) => r.recordType === RecordType.MAX_WEIGHT);
    expect(weightPR).toBeDefined();
    expect(weightPR?.value).toBe(85);
    expect(weightPR?.previousValue).toBe(80);

    const repsPR = newRecords.find((r) => r.recordType === RecordType.MAX_REPS);
    expect(repsPR).toBeDefined();
    expect(repsPR?.value).toBe(15);
    expect(repsPR?.previousValue).toBe(10);

    const volPR = newRecords.find((r) => r.recordType === RecordType.MAX_VOLUME);
    expect(volPR).toBeDefined();
    expect(volPR?.value).toBe(1050);
  });

  it('should award first-time records when no previous PRs exist', () => {
    const exerciseId = 'ex-squat';
    const sets = [
      { setId: 'set-1', exerciseId, weightKg: 100, reps: 5, isCompleted: true },
    ];

    const newRecords = PersonalRecordEngine.evaluateNewRecords(sets, []);

    expect(newRecords.length).toBe(3); // Weight (100), Reps (5), Volume (500)
  });
});
