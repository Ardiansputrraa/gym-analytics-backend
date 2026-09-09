import { calculateBmr } from './bmr.calculator';
import { Gender } from '../enums/gender.enum';

describe('BMR Calculator (Mifflin-St Jeor)', () => {
  it('should correctly calculate BMR for male', () => {
    // Male, 25 years old, 175 cm, 70 kg
    // BMR = (10 * 70) + (6.25 * 175) - (5 * 25) + 5
    //     = 700 + 1093.75 - 125 + 5 = 1673.75
    const bmr = calculateBmr({
      weightKg: 70,
      heightCm: 175,
      age: 25,
      gender: Gender.MALE,
    });
    expect(bmr).toBe(1673.75);
  });

  it('should correctly calculate BMR for female', () => {
    // Female, 28 years old, 160 cm, 55 kg
    // BMR = (10 * 55) + (6.25 * 160) - (5 * 28) - 161
    //     = 550 + 1000 - 140 - 161 = 1249
    const bmr = calculateBmr({
      weightKg: 55,
      heightCm: 160,
      age: 28,
      gender: Gender.FEMALE,
    });
    expect(bmr).toBe(1249);
  });

  it('should throw error when weight, height, or age is invalid (<= 0)', () => {
    expect(() =>
      calculateBmr({
        weightKg: 0,
        heightCm: 170,
        age: 25,
        gender: Gender.MALE,
      }),
    ).toThrow('Weight, height, and age must be greater than zero');
  });
});
