import { MuscleRecoveryCalculator } from './muscle-recovery.calculator';

describe('MuscleRecoveryCalculator', () => {
  const now = new Date('2026-09-21T12:00:00Z');

  it('should return 100% and Siap Latih if never trained', () => {
    const result = MuscleRecoveryCalculator.calculateRecovery(
      {
        muscleGroupName: 'CHEST',
        muscleGroupDisplayName: 'Dada',
        lastTrainedAt: null,
      },
      now,
    );

    expect(result.pct).toBe(100);
    expect(result.label).toBe('Siap Latih');
    expect(result.isReady).toBe(true);
  });

  it('should calculate correct recovery for CHEST (48h window)', () => {
    // 24 hours ago -> 50% recovery
    const trained24hAgo = new Date('2026-09-20T12:00:00Z');
    const result24h = MuscleRecoveryCalculator.calculateRecovery(
      {
        muscleGroupName: 'CHEST',
        muscleGroupDisplayName: 'Dada',
        lastTrainedAt: trained24hAgo,
      },
      now,
    );

    expect(result24h.hoursAgo).toBe(24);
    expect(result24h.pct).toBe(50);
    expect(result24h.label).toBe('Sedang Pulih');
    expect(result24h.isReady).toBe(false);

    // 48 hours ago -> 100% recovery
    const trained48hAgo = new Date('2026-09-19T12:00:00Z');
    const result48h = MuscleRecoveryCalculator.calculateRecovery(
      {
        muscleGroupName: 'CHEST',
        muscleGroupDisplayName: 'Dada',
        lastTrainedAt: trained48hAgo,
      },
      now,
    );

    expect(result48h.hoursAgo).toBe(48);
    expect(result48h.pct).toBe(100);
    expect(result48h.label).toBe('Pulih Total');
    expect(result48h.isReady).toBe(true);
  });

  it('should calculate correct recovery for LEGS (72h window)', () => {
    // 36 hours ago -> 50% recovery
    const trained36hAgo = new Date('2026-09-20T00:00:00Z');
    const result = MuscleRecoveryCalculator.calculateRecovery(
      {
        muscleGroupName: 'LEGS',
        muscleGroupDisplayName: 'Kaki',
        lastTrainedAt: trained36hAgo,
      },
      now,
    );

    expect(result.hoursAgo).toBe(36);
    expect(result.pct).toBe(50);
    expect(result.label).toBe('Sedang Pulih');
  });
});
