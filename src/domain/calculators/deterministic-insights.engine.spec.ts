import { DeterministicInsightsEngine } from './deterministic-insights.engine';

describe('DeterministicInsightsEngine', () => {
  it('should generate body composition insight when fat percentage decreases', () => {
    const insights = DeterministicInsightsEngine.generateInsights({
      latestBodyMeasurement: {
        weightKg: 74.0,
        bodyFatPct: 15.0,
        skeletalMuscleKg: 35.8,
        measuredAt: new Date(),
      },
      previousBodyMeasurement: {
        weightKg: 75.0,
        bodyFatPct: 16.0,
        skeletalMuscleKg: 35.5,
        measuredAt: new Date(),
      },
    });

    const bodyFatInsight = insights.find((i) => i.id === 'insight-body-fat-loss');
    expect(bodyFatInsight).toBeDefined();
    expect(bodyFatInsight?.title).toContain('Komposisi Tubuh');
    expect(bodyFatInsight?.description).toContain('1%');
  });

  it('should generate progressive overload insight when PRs exist', () => {
    const insights = DeterministicInsightsEngine.generateInsights({
      recentPrs: [
        {
          exerciseName: 'Barbell Bench Press',
          weightKg: 82.5,
          reps: 6,
          estimated1RM: 95.7,
          achievedAt: new Date(),
        },
      ],
    });

    const prInsight = insights.find((i) => i.id.startsWith('insight-pr-'));
    expect(prInsight).toBeDefined();
    expect(prInsight?.title).toContain('Progressive Overload');
    expect(prInsight?.description).toContain('82.5 kg');
  });

  it('should generate fallback insight if input is empty', () => {
    const insights = DeterministicInsightsEngine.generateInsights({});
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].id).toBe('insight-default-welcome');
  });
});
