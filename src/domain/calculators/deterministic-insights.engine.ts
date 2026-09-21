import { MuscleRecoveryStatus } from './muscle-recovery.calculator';

export type InsightType = 'INFO' | 'ACTION' | 'WARNING';

export interface DeterministicInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  category: 'BODY_COMPOSITION' | 'WORKOUT_OVERLOAD' | 'NUTRITION_HYDRATION' | 'RECOVERY';
  generatedAt: Date;
}

export interface InsightEngineInput {
  latestBodyMeasurement?: {
    weightKg: number;
    bodyFatPct?: number | null;
    skeletalMuscleKg?: number | null;
    measuredAt: Date;
  } | null;
  previousBodyMeasurement?: {
    weightKg: number;
    bodyFatPct?: number | null;
    skeletalMuscleKg?: number | null;
    measuredAt: Date;
  } | null;
  recentPrs?: {
    exerciseName: string;
    weightKg: number;
    reps: number;
    estimated1RM: number;
    achievedAt: Date;
  }[];
  nutritionSummary7Days?: {
    averageCalories: number;
    targetCalories: number;
    averageWaterMl: number;
    targetWaterMl: number;
    daysLogged: number;
  } | null;
  muscleRecoveryList?: MuscleRecoveryStatus[];
}

export class DeterministicInsightsEngine {
  /**
   * Generates deterministic insights strictly based on mathematical rules (PRD Section 17 & 26)
   */
  static generateInsights(input: InsightEngineInput): DeterministicInsight[] {
    const insights: DeterministicInsight[] = [];
    const now = new Date();

    // 1. Body Composition Progress Rule
    if (input.latestBodyMeasurement && input.previousBodyMeasurement) {
      const latest = input.latestBodyMeasurement;
      const prev = input.previousBodyMeasurement;

      const weightDelta = Number((latest.weightKg - prev.weightKg).toFixed(1));
      const fatDelta =
        latest.bodyFatPct != null && prev.bodyFatPct != null
          ? Number((latest.bodyFatPct - prev.bodyFatPct).toFixed(1))
          : null;
      const muscleDelta =
        latest.skeletalMuscleKg != null && prev.skeletalMuscleKg != null
          ? Number((latest.skeletalMuscleKg - prev.skeletalMuscleKg).toFixed(1))
          : null;

      if (fatDelta !== null && fatDelta < 0) {
        insights.push({
          id: 'insight-body-fat-loss',
          type: 'INFO',
          category: 'BODY_COMPOSITION',
          title: 'Progres Komposisi Tubuh Terpantau',
          description: `Estimasi Body Fat turun ${Math.abs(fatDelta)}% dalam evaluasi terakhir dengan massa otot ${
            muscleDelta != null && muscleDelta >= 0 ? `meningkat (+${muscleDelta} kg)` : 'stabil'
          }. Pertahankan pola makan & latihan teratur.`,
          generatedAt: now,
        });
      } else if (weightDelta !== 0) {
        insights.push({
          id: 'insight-body-weight-trend',
          type: 'INFO',
          category: 'BODY_COMPOSITION',
          title: 'Perubahan Berat Badan Terpantau',
          description: `Berat badan Anda ${
            weightDelta < 0 ? `turun ${Math.abs(weightDelta)} kg` : `naik ${weightDelta} kg`
          } dibandingkan pencatatan sebelumnya.`,
          generatedAt: now,
        });
      }
    }

    // 2. Progressive Overload / Personal Record Detection Rule
    if (input.recentPrs && input.recentPrs.length > 0) {
      const topPr = input.recentPrs[0];
      insights.push({
        id: `insight-pr-${topPr.exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'ACTION',
        category: 'WORKOUT_OVERLOAD',
        title: `Progressive Overload Terdeteksi pada ${topPr.exerciseName}`,
        description: `Rekor baru berhasil dicapai dengan beban ${topPr.weightKg} kg × ${topPr.reps} reps (Est 1RM: ${topPr.estimated1RM} kg). Pertahankan tempo dan kualitas form angkatan.`,
        generatedAt: now,
      });
    }

    // 3. Nutrition & Hydration Compliance Rule
    if (input.nutritionSummary7Days && input.nutritionSummary7Days.daysLogged > 0) {
      const n = input.nutritionSummary7Days;
      const calDiff = n.averageCalories - n.targetCalories;
      const waterPct = n.targetWaterMl > 0 ? (n.averageWaterMl / n.targetWaterMl) * 100 : 100;

      if (Math.abs(calDiff) <= 250 && waterPct >= 80) {
        insights.push({
          id: 'insight-nutrition-compliance',
          type: 'INFO',
          category: 'NUTRITION_HYDRATION',
          title: 'Kepatuhan Target Hidrasi & Kalori Optimal',
          description: `Asupan kalori 7 hari konsisten berada di rentang target (${n.averageCalories} kkal/hari). Hidrasi harian rata-rata mencapai ${(n.averageWaterMl / 1000).toFixed(1)} liter (${Math.round(waterPct)}% target).`,
          generatedAt: now,
        });
      } else if (waterPct < 70) {
        insights.push({
          id: 'insight-hydration-warning',
          type: 'WARNING',
          category: 'NUTRITION_HYDRATION',
          title: 'Peringatan Asupan Cairan & Hidrasi',
          description: `Rata-rata hidrasi harian (${(n.averageWaterMl / 1000).toFixed(1)}L) masih di bawah rekomendasi target (${(n.targetWaterMl / 1000).toFixed(1)}L). Tingkatkan konsumsi air mineral harian.`,
          generatedAt: now,
        });
      }
    }

    // 4. Muscle Readiness / Recovery Schedule Rule
    if (input.muscleRecoveryList && input.muscleRecoveryList.length > 0) {
      const readyMuscles = input.muscleRecoveryList.filter((m) => m.pct >= 90 && m.hoursAgo < 168);
      const recoveringMuscles = input.muscleRecoveryList.filter((m) => m.pct >= 50 && m.pct < 90);

      if (readyMuscles.length > 0) {
        const topReady = readyMuscles[0];
        insights.push({
          id: `insight-ready-${topReady.muscleGroupName.toLowerCase()}`,
          type: 'ACTION',
          category: 'RECOVERY',
          title: `Kelompok Otot ${topReady.name} Siap Latih`,
          description: `Kelompok otot ${topReady.name} telah pulih ${topReady.pct}% (${topReady.hoursAgo} jam sejak latihan terakhir) dan siap untuk target volume beban kerja optimal.`,
          generatedAt: now,
        });
      } else if (recoveringMuscles.length > 0) {
        const topRecovering = recoveringMuscles[0];
        insights.push({
          id: `insight-recovering-${topRecovering.muscleGroupName.toLowerCase()}`,
          type: 'WARNING',
          category: 'RECOVERY',
          title: `Kelompok Otot ${topRecovering.name} Dalam Fase Pemulihan`,
          description: `Kelompok otot ${topRecovering.name} saat ini mencapai ${topRecovering.pct}% pemulihan dan akan siap 100% dalam waktu dekat. Fokuskan latihan pada kelompok otot lainnya.`,
          generatedAt: now,
        });
      }
    }

    // Fallback default insight if no data
    if (insights.length === 0) {
      insights.push({
        id: 'insight-default-welcome',
        type: 'INFO',
        category: 'WORKOUT_OVERLOAD',
        title: 'Mulai Catat Sesi Latihan & Nutrisi Anda',
        description: 'Sistem analitik akan menghasilkan insight dan rekomendasi deterministik otomatis seiring Anda mencatat log latihan, nutrisi harian, dan komposisi tubuh.',
        generatedAt: now,
      });
    }

    return insights;
  }
}
