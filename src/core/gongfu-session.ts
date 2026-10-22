// ============================================================================
// Napar (Steepwise) — Gongfu Cha Multi-Infusion Tracker
// Apps4Brew: 100% Offline, wielokrotne ekstrakcje liścia herbaty
// ============================================================================

import { estimateTeaInfusionCaffeineMg } from './domain-rules';

export type GongfuTeaType =
  | 'wulong_rock' // Wulong Skalny (Da Hong Pao, Rou Gui)
  | 'wulong_high_mountain' // Wulong Wysokogórski (Ali Shan, Tie Guan Yin)
  | 'puerh_sheng' // Młody lub starzony Sheng Puerh
  | 'puerh_shou' // Dojrzały Shou Puerh
  | 'black' // Czarna chińska (Hong Cha, Jin Jun Mei)
  | 'white' // Biała (Bai Hao Yin Zhen, Shou Mei, Pai Mu Tan)
  | 'green'; // Zielona (Long Jing, Bi Luo Chun)

export interface GongfuInfusion {
  infusionNumber: number;
  durationSeconds: number;
  waterTempCelsius: number;
  waterGrams: number;
  caffeineMg: number;
  flavorNotes?: string[];
  tasteRating?: number; // 1-5
  notes?: string;
  completedAt: string;
}

export interface GongfuSession {
  id: string;
  teaName: string;
  teaType: GongfuTeaType;
  inventoryItemId?: string;
  leafDoseGrams: number;
  vesselCapacityMl: number;
  waterTempCelsius: number;
  rinseCompleted: boolean;
  infusions: GongfuInfusion[];
  totalCaffeineMg: number;
  isFinished: boolean;
  startedAt: string;
  updatedAt: string;
}

/**
 * Podpowiada rekomendowany czas parzenia (w sekundach) dla zadanego typu herbaty i numeru infuzji
 */
export function getRecommendedGongfuSteepSeconds(
  teaType: GongfuTeaType,
  infusionNumber: number
): number {
  if (infusionNumber <= 0) return 10;

  switch (teaType) {
    case 'wulong_rock':
      // 1: 15s, 2: 20s, 3: 25s, 4: 35s, 5: 50s, 6: 70s, 7: 95s, +25s
      if (infusionNumber === 1) return 15;
      if (infusionNumber === 2) return 20;
      if (infusionNumber === 3) return 25;
      if (infusionNumber === 4) return 35;
      if (infusionNumber === 5) return 50;
      if (infusionNumber === 6) return 70;
      return 70 + (infusionNumber - 6) * 25;

    case 'puerh_sheng':
      // 1: 10s, 2: 12s, 3: 15s, 4: 20s, 5: 30s, 6: 45s, 7: 65s, +20s
      if (infusionNumber === 1) return 10;
      if (infusionNumber === 2) return 12;
      if (infusionNumber === 3) return 15;
      if (infusionNumber === 4) return 20;
      if (infusionNumber === 5) return 30;
      if (infusionNumber === 6) return 45;
      return 45 + (infusionNumber - 6) * 20;

    case 'puerh_shou':
      // 1: 15s, 2: 15s, 3: 20s, 4: 25s, 5: 35s, 6: 50s, +20s
      if (infusionNumber <= 2) return 15;
      if (infusionNumber === 3) return 20;
      if (infusionNumber === 4) return 25;
      if (infusionNumber === 5) return 35;
      return 35 + (infusionNumber - 5) * 20;

    case 'wulong_high_mountain':
      // 1: 20s, 2: 25s, 3: 35s, 4: 50s, 5: 70s, +25s
      if (infusionNumber === 1) return 20;
      if (infusionNumber === 2) return 25;
      if (infusionNumber === 3) return 35;
      if (infusionNumber === 4) return 50;
      return 50 + (infusionNumber - 4) * 25;

    case 'white':
      // 1: 25s, 2: 30s, 3: 40s, 4: 55s, 5: 75s, +25s
      if (infusionNumber === 1) return 25;
      if (infusionNumber === 2) return 30;
      if (infusionNumber === 3) return 40;
      if (infusionNumber === 4) return 55;
      return 55 + (infusionNumber - 4) * 25;

    case 'black':
      // 1: 12s, 2: 15s, 3: 20s, 4: 30s, 5: 45s, +20s
      if (infusionNumber === 1) return 12;
      if (infusionNumber === 2) return 15;
      if (infusionNumber === 3) return 20;
      if (infusionNumber === 4) return 30;
      return 30 + (infusionNumber - 4) * 20;

    case 'green':
    default:
      // 1: 20s, 2: 25s, 3: 35s, 4: 50s, +20s
      if (infusionNumber === 1) return 20;
      if (infusionNumber === 2) return 25;
      if (infusionNumber === 3) return 35;
      return 35 + (infusionNumber - 3) * 20;
  }
}

/**
 * Szacuje całkowity ładunek kofeiny w suchych liściach (3.0% wagi suchej)
 */
export function estimateTotalLeafCaffeineMg(leafDoseGrams: number): number {
  return Number((leafDoseGrams * 1000 * 0.03).toFixed(1));
}

/**
 * Tworzy nową sesję Gongfu Cha
 */
export function createGongfuSession(params: {
  teaName: string;
  teaType: GongfuTeaType;
  inventoryItemId?: string;
  leafDoseGrams: number;
  vesselCapacityMl: number;
  waterTempCelsius: number;
}): GongfuSession {
  const now = new Date().toISOString();
  return {
    id: `gongfu-${Date.now()}`,
    teaName: params.teaName,
    teaType: params.teaType,
    inventoryItemId: params.inventoryItemId,
    leafDoseGrams: params.leafDoseGrams,
    vesselCapacityMl: params.vesselCapacityMl,
    waterTempCelsius: params.waterTempCelsius,
    rinseCompleted: false,
    infusions: [],
    totalCaffeineMg: 0,
    isFinished: false,
    startedAt: now,
    updatedAt: now,
  };
}

/**
 * Ocena całej sesji: średnia ocen zalań (1-5) zaokrąglona do pełnej gwiazdki.
 * Zwraca null, gdy żadne zalanie nie ma oceny — nie podstawiamy domyślnej wartości.
 */
export function getGongfuSessionRating(session: GongfuSession): number | null {
  const rated = session.infusions.filter((inf) => typeof inf.tasteRating === 'number');
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, inf) => acc + (inf.tasteRating as number), 0);
  return Math.round(sum / rated.length);
}

/**
 * Rejestruje ukończone zalanie i aktualizuje ładunek kofeiny sesji
 */
export function recordGongfuInfusion(
  session: GongfuSession,
  infusionData: {
    durationSeconds: number;
    waterTempCelsius?: number;
    flavorNotes?: string[];
    tasteRating?: number;
    notes?: string;
  }
): GongfuSession {
  const nextInfusionNumber = session.infusions.length + 1;
  const totalLeafCaffeine = estimateTotalLeafCaffeineMg(session.leafDoseGrams);
  const caffeineThisInfusion = estimateTeaInfusionCaffeineMg(
    totalLeafCaffeine,
    nextInfusionNumber
  );

  const newInfusion: GongfuInfusion = {
    infusionNumber: nextInfusionNumber,
    durationSeconds: infusionData.durationSeconds,
    waterTempCelsius: infusionData.waterTempCelsius || session.waterTempCelsius,
    waterGrams: session.vesselCapacityMl,
    caffeineMg: caffeineThisInfusion,
    flavorNotes: infusionData.flavorNotes,
    tasteRating: infusionData.tasteRating,
    notes: infusionData.notes,
    completedAt: new Date().toISOString(),
  };

  const updatedInfusions = [...session.infusions, newInfusion];
  const newTotalCaffeine = Number(
    updatedInfusions.reduce((sum, inf) => sum + inf.caffeineMg, 0).toFixed(1)
  );

  return {
    ...session,
    infusions: updatedInfusions,
    totalCaffeineMg: newTotalCaffeine,
    updatedAt: new Date().toISOString(),
  };
}
