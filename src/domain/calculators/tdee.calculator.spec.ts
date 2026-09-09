import { calculateTdee, getActivityFactor } from './tdee.calculator';
import { ActivityLevel } from '../enums/activity-level.enum';

describe('TDEE Calculator', () => {
  it('should calculate TDEE correctly for moderate activity', () => {
    // BMR 1673.75 * 1.55 = 2594.3125 -> 2594.31
    const result = calculateTdee({
      bmr: 1673.75,
      activityLevel: ActivityLevel.MODERATE,
    });
    expect(result.activityFactor).toBe(1.55);
    expect(result.tdee).toBe(2594.31);
  });

  it('should calculate TDEE correctly for sedentary activity', () => {
    const result = calculateTdee({
      bmr: 1500,
      activityLevel: ActivityLevel.SEDENTARY,
    });
    expect(result.activityFactor).toBe(1.2);
    expect(result.tdee).toBe(1800);
  });

  it('should correctly return all activity factors', () => {
    expect(getActivityFactor(ActivityLevel.SEDENTARY)).toBe(1.2);
    expect(getActivityFactor(ActivityLevel.LIGHT)).toBe(1.375);
    expect(getActivityFactor(ActivityLevel.MODERATE)).toBe(1.55);
    expect(getActivityFactor(ActivityLevel.ACTIVE)).toBe(1.725);
    expect(getActivityFactor(ActivityLevel.VERY_ACTIVE)).toBe(1.9);
  });

  it('should throw error when BMR <= 0', () => {
    expect(() =>
      calculateTdee({
        bmr: 0,
        activityLevel: ActivityLevel.MODERATE,
      }),
    ).toThrow('BMR must be greater than zero');
  });
});
