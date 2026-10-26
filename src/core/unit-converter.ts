// ============================================================================
// Napar (Steepwise) — Unit Converter (Metric / Imperial — DEC-21 & NFR-I18N)
// Obsługa jednostek metrycznych (°C, g, ml) i imperialnych (°F, oz, fl oz)
// ============================================================================

export type UnitSystem = 'metric' | 'imperial';

/**
 * Przelicza stopnie Celsjusza na Fahrenheita
 */
export function celsiusToFahrenheit(c: number): number {
  if (!Number.isFinite(c)) return 0;
  return Math.round((c * 9) / 5 + 32);
}

/**
 * Przelicza stopnie Fahrenheita na Celsjusza
 */
export function fahrenheitToCelsius(f: number): number {
  if (!Number.isFinite(f)) return 0;
  return Math.round(((f - 32) * 5) / 9);
}

/**
 * Przelicza gramy na uncje wagowe (oz)
 */
export function gramsToOunces(g: number): number {
  if (!Number.isFinite(g) || g < 0) return 0;
  return parseFloat((g * 0.03527396195).toFixed(2));
}

/**
 * Przelicza uncje wagowe (oz) na gramy
 */
export function ouncesToGrams(oz: number): number {
  if (!Number.isFinite(oz) || oz < 0) return 0;
  return Math.round(oz / 0.03527396195);
}

/**
 * Przelicza mililitry / gramy wody na uncje objętościowe (fl oz)
 */
export function mlToFluidOunces(ml: number): number {
  if (!Number.isFinite(ml) || ml < 0) return 0;
  return parseFloat((ml * 0.0338140227).toFixed(2));
}

/**
 * Przelicza uncje objętościowe (fl oz) na mililitry / gramy wody
 */
export function fluidOuncesToMl(flOz: number): number {
  if (!Number.isFinite(flOz) || flOz < 0) return 0;
  return Math.round(flOz / 0.0338140227);
}

/**
 * Formatuje temperaturę zgodnie z wybranym układem jednostek
 */
export function formatTemperature(celsius: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(celsius)) {
    return unitSystem === 'imperial' ? '32°F' : '0°C';
  }
  if (unitSystem === 'imperial') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Formatuje wagę suchą kawy / herbaty zgodnie z wybranym układem jednostek
 */
export function formatDoseWeight(grams: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return unitSystem === 'imperial' ? '0 oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${gramsToOunces(grams)} oz`;
  }
  return `${grams}g`;
}

/**
 * Formatuje objętość lub wagę wody
 */
export function formatWaterWeight(grams: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${mlToFluidOunces(grams)} fl oz`;
  }
  return `${grams}g`;
}

/**
 * Pomocnicze zaokrąglanie do określonej liczby miejsc po przecinku
 */
export function roundTo(val: number, decimals: number): number {
  if (!Number.isFinite(val)) return 0;
  const safeDec = Math.max(0, Math.min(10, Math.floor(decimals) || 0));
  const factor = Math.pow(10, safeDec);
  return Math.round(val * factor) / factor;
}

/**
 * RD-ENG-01 & BR-TEST-005: Konwersja wejściowa bez dryfu zaokrągleń (wInKeep)
 * Zachowuje dokładną wartość bazową v_prev, jeżeli sformatowana liczba w jednostce wyświetlania
 * zgadza się po zaokrągleniu do 0.1 z liczbą wpisaną przez użytkownika.
 */
export function wInKeep(txt: string, unit: string, prevBase?: number): number {
  const safePrev = typeof prevBase === 'number' && Number.isFinite(prevBase) ? prevBase : 0;
  if (typeof txt !== 'string') return safePrev;
  const normalized = txt.replace(',', '.').trim();
  const xIn = parseFloat(normalized);
  if (isNaN(xIn) || !isFinite(xIn)) {
    return safePrev;
  }

  // Współczynniki konwersji jednostek
  const u = typeof unit === 'string' ? unit.toLowerCase() : '';
  let cu = 1;
  const isFahrenheit = u === '°f' || u === 'f';

  if (u === 'lb' || u === 'lbs') {
    cu = 2.20462262185;
  } else if (u === 'oz') {
    cu = 0.03527396195;
  } else if (u === 'fl oz' || u === 'floz') {
    cu = 0.0338140227;
  } else {
    cu = 1;
  }

  if (prevBase !== undefined && Number.isFinite(prevBase) && prevBase > 0) {
    if (isFahrenheit) {
      const fPrev = roundTo((prevBase * 9) / 5 + 32, 1);
      if (roundTo(xIn, 1) === fPrev) {
        return prevBase;
      }
      return roundTo(((xIn - 32) * 5) / 9, 2);
    } else {
      const fPrev1 = roundTo(prevBase * cu, 1);
      const fPrev2 = roundTo(prevBase * cu, 2);
      if (roundTo(xIn, 1) === fPrev1 || roundTo(xIn, 2) === fPrev2) {
        return prevBase;
      }
      return roundTo(xIn / cu, 2);
    }
  }

  // Brak prevBase
  if (isFahrenheit) {
    return roundTo(((xIn - 32) * 5) / 9, 2);
  }
  return roundTo(xIn / cu, 2);
}
