import {
  BodyCompositionStatus,
  BodyCompositionDelta,
  BodyMeasurementEntity,
} from '../entities/body-measurement.entity';

export interface BodyCompositionDerivatives {
  bodyFatKg: number | null;
  bodyFatPct: number | null;
  fatFreeMassKg: number | null;
  bmi: number | null;
}

export interface NormalRanges {
  bmiMin: number;
  bmiMax: number;
  smmMin: number;
  smmMax: number;
  bodyFatKgMin: number;
  bodyFatKgMax: number;
  bodyFatPctMin: number;
  bodyFatPctMax: number;
}

export class BodyCompositionCalculator {
  /**
   * Calculates BMI given weight in kg and height in cm
   */
  static calculateBMI(weightKg: number, heightCm: number): number {
    if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    return Math.round(rawBmi * 10) / 10;
  }

  /**
   * Derives missing body fat mass (kg), body fat percentage (%), and fat-free mass (kg)
   */
  static calculateDerivatives(
    weightKg: number,
    heightCm?: number | null,
    bodyFatKg?: number | null,
    bodyFatPct?: number | null,
    fatFreeMassKg?: number | null,
  ): BodyCompositionDerivatives {
    const w = Math.max(0, Number(weightKg) || 0);
    let fatKg = bodyFatKg !== undefined && bodyFatKg !== null ? Number(bodyFatKg) : null;
    let fatPct = bodyFatPct !== undefined && bodyFatPct !== null ? Number(bodyFatPct) : null;
    let ffmKg = fatFreeMassKg !== undefined && fatFreeMassKg !== null ? Number(fatFreeMassKg) : null;

    if (w > 0) {
      if (fatKg !== null && fatKg > 0) {
        if (fatPct === null) fatPct = Math.round((fatKg / w) * 1000) / 10;
        if (ffmKg === null) ffmKg = Math.round(Math.max(0, w - fatKg) * 10) / 10;
      } else if (fatPct !== null && fatPct > 0) {
        if (fatKg === null) fatKg = Math.round((w * (fatPct / 100)) * 10) / 10;
        if (ffmKg === null) ffmKg = Math.round(Math.max(0, w - fatKg) * 10) / 10;
      } else if (ffmKg !== null && ffmKg > 0) {
        if (fatKg === null) fatKg = Math.round(Math.max(0, w - ffmKg) * 10) / 10;
        if (fatPct === null) fatPct = Math.round((fatKg / w) * 1000) / 10;
      }
    }

    const bmi = heightCm && heightCm > 0 ? this.calculateBMI(w, heightCm) : null;

    return {
      bodyFatKg: fatKg !== null ? Math.round(fatKg * 10) / 10 : null,
      bodyFatPct: fatPct !== null ? Math.round(fatPct * 10) / 10 : null,
      fatFreeMassKg: ffmKg !== null ? Math.round(ffmKg * 10) / 10 : null,
      bmi,
    };
  }

  /**
   * Compares current measurement with previous measurement to evaluate deltas & progress status
   */
  static evaluateProgress(
    current: {
      weightKg: number;
      skeletalMuscleKg?: number | null;
      bodyFatKg?: number | null;
      bodyFatPct?: number | null;
      waterContentKg?: number | null;
    },
    previous?: {
      weightKg: number;
      skeletalMuscleKg?: number | null;
      bodyFatKg?: number | null;
      bodyFatPct?: number | null;
      waterContentKg?: number | null;
    } | null,
  ): BodyCompositionDelta {
    if (!previous) {
      return {
        weightDeltaKg: 0,
        weightDeltaPct: 0,
        smmDeltaKg: 0,
        smmDeltaPct: 0,
        bodyFatKgDelta: 0,
        bodyFatPctDelta: 0,
        waterContentKgDelta: 0,
        status: BodyCompositionStatus.MAINTENANCE,
        evaluation: 'Scan awal transformasi komposisi tubuh',
      };
    }

    const weightDeltaKg = Math.round((current.weightKg - previous.weightKg) * 10) / 10;
    const weightDeltaPct =
      previous.weightKg > 0
        ? Math.round((weightDeltaKg / previous.weightKg) * 1000) / 10
        : 0;

    const smmDeltaKg =
      current.skeletalMuscleKg !== null &&
      current.skeletalMuscleKg !== undefined &&
      previous.skeletalMuscleKg !== null &&
      previous.skeletalMuscleKg !== undefined
        ? Math.round((Number(current.skeletalMuscleKg) - Number(previous.skeletalMuscleKg)) * 10) / 10
        : null;

    const smmDeltaPct =
      smmDeltaKg !== null && previous.skeletalMuscleKg && Number(previous.skeletalMuscleKg) > 0
        ? Math.round((smmDeltaKg / Number(previous.skeletalMuscleKg)) * 1000) / 10
        : null;

    const bodyFatKgDelta =
      current.bodyFatKg !== null &&
      current.bodyFatKg !== undefined &&
      previous.bodyFatKg !== null &&
      previous.bodyFatKg !== undefined
        ? Math.round((Number(current.bodyFatKg) - Number(previous.bodyFatKg)) * 10) / 10
        : null;

    const bodyFatPctDelta =
      current.bodyFatPct !== null &&
      current.bodyFatPct !== undefined &&
      previous.bodyFatPct !== null &&
      previous.bodyFatPct !== undefined
        ? Math.round((Number(current.bodyFatPct) - Number(previous.bodyFatPct)) * 10) / 10
        : null;

    const waterContentKgDelta =
      current.waterContentKg !== null &&
      current.waterContentKg !== undefined &&
      previous.waterContentKg !== null &&
      previous.waterContentKg !== undefined
        ? Math.round((Number(current.waterContentKg) - Number(previous.waterContentKg)) * 10) / 10
        : null;

    // Determine status & evaluation description
    let status = BodyCompositionStatus.MAINTENANCE;
    let evaluation = 'Komposisi tubuh stabil dalam rentang pemeliharaan';

    if (smmDeltaKg !== null && smmDeltaKg >= 0.2 && (bodyFatKgDelta === null || bodyFatKgDelta <= 0.3)) {
      status = BodyCompositionStatus.MUSCLE_GAIN;
      evaluation = `Pertumbuhan massa otot rangka (+${smmDeltaKg} kg) dengan lemak terkontrol`;
    } else if (bodyFatKgDelta !== null && bodyFatKgDelta <= -0.3) {
      status = BodyCompositionStatus.FAT_LOSS;
      if (smmDeltaKg !== null && smmDeltaKg >= 0) {
        evaluation = `Fat loss konsisten (-${Math.abs(bodyFatKgDelta)} kg lemak) & otot rangka terjaga`;
      } else {
        evaluation = `Penurunan massa lemak (-${Math.abs(bodyFatKgDelta)} kg) berhasil tercapai`;
      }
    } else if (weightDeltaKg <= -0.5) {
      status = BodyCompositionStatus.FAT_LOSS;
      evaluation = `Penurunan berat badan (${weightDeltaKg} kg) pada fase defisit kalori`;
    } else if (smmDeltaKg !== null && smmDeltaKg > 0.4) {
      status = BodyCompositionStatus.PR_COMPOSITION;
      evaluation = 'Rekor pertumbuhan otot rangka tertinggi!';
    }

    return {
      weightDeltaKg,
      weightDeltaPct,
      smmDeltaKg,
      smmDeltaPct,
      bodyFatKgDelta,
      bodyFatPctDelta,
      waterContentKgDelta,
      status,
      evaluation,
    };
  }

  /**
   * Returns standard sports science normal reference ranges based on gender and height
   */
  static getNormalRanges(
    gender: 'MALE' | 'FEMALE' = 'MALE',
    heightCm: number = 170,
    weightKg: number = 70,
  ): NormalRanges {
    const heightM = Math.max(1.2, Number(heightCm) / 100);

    // SMM normal reference
    const smmMin =
      gender === 'FEMALE'
        ? Math.round(heightM * heightM * 8.5 * 10) / 10
        : Math.round(heightM * heightM * 11.5 * 10) / 10;
    const smmMax =
      gender === 'FEMALE'
        ? Math.round(heightM * heightM * 11.0 * 10) / 10
        : Math.round(heightM * heightM * 14.5 * 10) / 10;

    // Body Fat normal reference (kg & %)
    const bodyFatPctMin = gender === 'FEMALE' ? 18.0 : 10.0;
    const bodyFatPctMax = gender === 'FEMALE' ? 28.0 : 20.0;

    const bodyFatKgMin = Math.round((weightKg * (bodyFatPctMin / 100)) * 10) / 10;
    const bodyFatKgMax = Math.round((weightKg * (bodyFatPctMax / 100)) * 10) / 10;

    return {
      bmiMin: 18.5,
      bmiMax: 24.9,
      smmMin,
      smmMax,
      bodyFatKgMin,
      bodyFatKgMax,
      bodyFatPctMin,
      bodyFatPctMax,
    };
  }
}
