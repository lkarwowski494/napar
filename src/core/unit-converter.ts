// ============================================================================
// Napar (Steepwise) — Unit Converter (Metric / Imperial — DEC-21 & NFR-I18N)
// Obsługa jednostek metrycznych (°C, g, ml) i imperialnych (°F, oz, fl oz)
// ============================================================================

export type UnitSystem = 'metric' | 'imperial';

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return NaN;
    return Object.is(val, -0) ? 0 : val;
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
    const m = clean.match(/^[+-]?\d+(?:\.\d+)?/);
    if (!m) return NaN;
    const num = parseFloat(m[0]);
    if (!Number.isFinite(num)) return NaN;
    return Object.is(num, -0) ? 0 : num;
  }
  return NaN;
}

/**
 * Przelicza stopnie Celsjusza na Fahrenheita
 */
export function celsiusToFahrenheit(c: number | string): number {
  const numC = parseNumeric(c);
  if (isNaN(numC)) return 0;
  const res = Math.round((numC * 9) / 5 + 32);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza stopnie Fahrenheita na Celsjusza
 */
export function fahrenheitToCelsius(f: number | string): number {
  const numF = parseNumeric(f);
  if (isNaN(numF)) return 0;
  const res = Math.round(((numF - 32) * 5) / 9);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza gramy na uncje wagowe (oz)
 */
export function gramsToOunces(g: number | string): number {
  const numG = parseNumeric(g);
  if (isNaN(numG) || numG <= 0) return 0;
  const res = parseFloat((numG * 0.03527396195).toFixed(2));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje wagowe (oz) na gramy
 */
export function ouncesToGrams(oz: number | string): number {
  const numOz = parseNumeric(oz);
  if (isNaN(numOz) || numOz <= 0) return 0;
  const res = Math.round(numOz / 0.03527396195);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza mililitry / gramy wody na uncje objętościowe (fl oz)
 */
export function mlToFluidOunces(ml: number | string): number {
  const numMl = parseNumeric(ml);
  if (isNaN(numMl) || numMl <= 0) return 0;
  const res = parseFloat((numMl * 0.0338140227).toFixed(2));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje objętościowe (fl oz) na mililitry / gramy wody
 */
export function fluidOuncesToMl(flOz: number | string): number {
  const numFlOz = parseNumeric(flOz);
  if (isNaN(numFlOz) || numFlOz <= 0) return 0;
  const res = Math.round(numFlOz / 0.0338140227);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Formatuje temperaturę zgodnie z wybranym układem jednostek
 */
export function formatTemperature(celsius: number | string, unitSystem: UnitSystem = 'metric'): string {
  const num = parseNumeric(celsius);
  if (isNaN(num)) {
    return unitSystem === 'imperial' ? '32°F' : '0°C';
  }
  if (unitSystem === 'imperial') {
    return `${celsiusToFahrenheit(num)}°F`;
  }
  const rounded = Math.round(num);
  return `${Object.is(rounded, -0) ? 0 : rounded}°C`;
}

/**
 * Formatuje wagę suchą kawy / herbaty zgodnie z wybranym układem jednostek
 */
export function formatDoseWeight(grams: number | string, unitSystem: UnitSystem = 'metric'): string {
  const num = parseNumeric(grams);
  if (isNaN(num) || num < 0 || Object.is(num, -0)) {
    return unitSystem === 'imperial' ? '0 oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${gramsToOunces(num)} oz`;
  }
  return `${Number(num.toFixed(1))}g`;
}

/**
 * Formatuje wagę wody (g lub fl oz)
 */
export function formatWaterWeight(grams: number | string, unitSystem: UnitSystem = 'metric'): string {
  const num = parseNumeric(grams);
  if (isNaN(num) || num < 0 || Object.is(num, -0)) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${mlToFluidOunces(num)} fl oz`;
  }
  return `${Number(num.toFixed(1))}g`;
}

/**
 * Formatuje objętość wody (ml lub fl oz)
 */
export function formatWaterVolume(gramsOrMl: number | string, unitSystem: UnitSystem = 'metric'): string {
  const num = parseNumeric(gramsOrMl);
  if (isNaN(num) || num < 0 || Object.is(num, -0)) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0 ml';
  }
  if (unitSystem === 'imperial') {
    return `${mlToFluidOunces(num)} fl oz`;
  }
  return `${Number(num.toFixed(1))} ml`;
}

/**
 * Pomocnicze zaokrąglanie do określonej liczby miejsc po przecinku
 */
export function roundTo(val: number, decimals: number): number {
  const num = parseNumeric(val);
  if (isNaN(num)) return 0;
  const numDec = parseNumeric(decimals);
  const safeDec = Math.max(0, Math.min(10, Math.floor(isNaN(numDec) ? 0 : numDec)));
  const factor = Math.pow(10, safeDec);
  let res = Math.round(num * factor) / factor;
  if (Object.is(res, -0) || res === 0) res = 0;
  return res;
}

/**
 * RD-ENG-01 & BR-TEST-005: Konwersja wejściowa bez dryfu zaokrągleń (wInKeep)
 * Zachowuje dokładną wartość bazową v_prev, jeżeli sformatowana liczba w jednostce wyświetlania
 * zgadza się po zaokrągleniu do 0.1 z liczbą wpisaną przez użytkownika.
 */
export function wInKeep(txt: string, unit: string, prevBase?: number): number {
  const safePrev = typeof prevBase === 'number' && Number.isFinite(prevBase) ? (Object.is(prevBase, -0) ? 0 : prevBase) : 0;
  if (typeof txt !== 'string') return safePrev;
  const clean = txt.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
  const m = clean.match(/^[+-]?\d+(?:\.\d+)?/);
  if (!m) return safePrev;
  const xIn = parseFloat(m[0]);
  if (isNaN(xIn) || !isFinite(xIn)) {
    return safePrev;
  }
  if (Object.is(xIn, -0)) return 0;

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

/**
 * Formatuje proporcję parzenia do standardu baristycznego (np. '1:16', '1:16.7').
 * Zabezpiecza przed ujemnymi wartościami, -0, NaN, pustymi ciągami i formatami 1/X.
 */
export function formatRatio(ratio: number | string | undefined | null, prefix = '1:'): string {
  if (ratio === undefined || ratio === null) return `${prefix}16`;
  let val: number;
  if (typeof ratio === 'number') {
    val = ratio;
  } else if (typeof ratio === 'string') {
    const clean = ratio.replace(/\uFEFF/g, '').replace(/1[:/]/, '').replace(',', '.').trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  if (!Number.isFinite(val) || val <= 0 || Object.is(val, -0)) {
    return `${prefix}16`;
  }

  const safeVal = Math.min(100, Math.max(1, val));
  const rounded = Number(safeVal.toFixed(1));
  const displayVal = rounded % 1 === 0 ? String(Math.floor(rounded)) : String(rounded);
  return `${prefix}${displayVal}`;
}

/**
 * Formatuje ciśnienie parzenia w barach (np. 9 -> '9.0 bar').
 */
export function formatPressure(bars: number | string | undefined | null, decimals = 1): string {
  if (bars === undefined || bars === null) return `0.0 bar`;
  let val: number;
  if (typeof bars === 'number') {
    val = bars;
  } else if (typeof bars === 'string') {
    const clean = bars.replace(/\uFEFF/g, '').replace(/[^\d.,]/g, '').replace(',', '.').trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeVal = Number.isFinite(val) && val >= 0 && !Object.is(val, -0)
    ? Math.min(30, val)
    : 0;

  return `${safeVal.toFixed(decimals)} bar`;
}


/**
 * Formatuje prędkość przepływu w gramach na sekundę (np. 2.4 -> '2.4 g/s').
 */
export function formatFlowRate(
  gramsPerSecond: number | string | undefined | null,
  decimals = 1
): string {
  if (gramsPerSecond === undefined || gramsPerSecond === null) return `0.0 g/s`;
  let val: number;
  if (typeof gramsPerSecond === 'number') {
    val = gramsPerSecond;
  } else if (typeof gramsPerSecond === 'string') {
    const clean = gramsPerSecond
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeVal =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0) ? Math.min(100, val) : 0;

  return `${safeVal.toFixed(decimals)} g/s`;
}

/**
 * Formatuje uzysk ekstrakcji w procentach (np. 20.15 -> '20.1%').
 */
export function formatExtractionYield(
  yieldPercent: number | string | undefined | null,
  decimals = 1
): string {
  if (yieldPercent === undefined || yieldPercent === null) return `0.0%`;
  let val: number;
  if (typeof yieldPercent === 'number') {
    val = yieldPercent;
  } else if (typeof yieldPercent === 'string') {
    const clean = yieldPercent
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeVal =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0) ? Math.min(50, val) : 0;

  return `${safeVal.toFixed(decimals)}%`;
}

/**
 * Formatuje stężenie TDS (Total Dissolved Solids) w procentach (np. 1.35 -> '1.35%').
 */
export function formatTdsPercentage(
  tdsPercent: number | string | undefined | null,
  decimals = 2
): string {
  if (tdsPercent === undefined || tdsPercent === null) return `${(0).toFixed(decimals)}%`;
  let val: number;
  if (typeof tdsPercent === 'number') {
    val = tdsPercent;
  } else if (typeof tdsPercent === 'string') {
    const clean = tdsPercent
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeVal =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0) ? Math.min(30, val) : 0;

  return `${safeVal.toFixed(decimals)}%`;
}

/**
 * Formatuje twardość wody w wybranej jednostce ('ppm', 'dH' / '°dH', 'gpg', 'mg/l')
 * z bezpieczną konwersją z ppm CaCO3:
 * - 1 °dH = 17.848 ppm CaCO3
 * - 1 gpg = 17.118 ppm CaCO3
 * - 1 ppm = 1 mg/L
 */
export function formatWaterHardness(
  ppmCaCO3: number | string | undefined | null,
  unit: 'ppm' | 'dH' | '°dH' | 'gpg' | 'mg/l' | string = 'ppm',
  decimals = 1
): string {
  if (ppmCaCO3 === undefined || ppmCaCO3 === null) {
    return renderHardness(0, unit, decimals);
  }

  let val: number;
  if (typeof ppmCaCO3 === 'number') {
    val = ppmCaCO3;
  } else if (typeof ppmCaCO3 === 'string') {
    const clean = ppmCaCO3
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safePpm =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(2000, val)
      : 0;

  return renderHardness(safePpm, unit, decimals);
}

function renderHardness(ppm: number, unit: string, decimals: number): string {
  const normUnit = typeof unit === 'string' ? unit.trim().toLowerCase() : 'ppm';
  if (normUnit === 'dh' || normUnit === '°dh') {
    const dh = ppm / 17.848;
    const rounded = Number(dh.toFixed(decimals));
    const safeNum = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeNum.toFixed(decimals)} °dH`;
  }
  if (normUnit === 'gpg') {
    const gpg = ppm / 17.118;
    const rounded = Number(gpg.toFixed(decimals));
    const safeNum = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeNum.toFixed(decimals)} gpg`;
  }
  if (normUnit === 'mg/l') {
    const rounded = Number(ppm.toFixed(decimals));
    const safeNum = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeNum.toFixed(decimals)} mg/L`;
  }
  // Domyślnie ppm
  const rounded = Number(ppm.toFixed(decimals));
  const safeNum = Object.is(rounded, -0) ? 0 : rounded;
  return `${safeNum.toFixed(decimals)} ppm`;
}


/**
 * Formatuje wielkość cząstek mielenia kawy w mikronach ('µm' / 'um') lub milimetrach ('mm')
 * z pełną sanityzacją wartości liczbowych i zabezpieczeniem przed -0 oraz NaN.
 */
export function formatParticleSize(
  microns: number | string | undefined | null,
  unit: 'µm' | 'um' | 'mm' | string = 'µm',
  decimals?: number
): string {
  if (microns === undefined || microns === null) {
    const isMm = typeof unit === 'string' && unit.trim().toLowerCase() === 'mm';
    const dec = typeof decimals === 'number' && Number.isFinite(decimals) ? Math.max(0, Math.min(6, decimals)) : isMm ? 2 : 0;
    return isMm ? `${(0).toFixed(dec)} mm` : `${(0).toFixed(dec)} µm`;
  }

  let val: number;
  if (typeof microns === 'number') {
    val = microns;
  } else if (typeof microns === 'string') {
    const clean = microns
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeMicrons =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(5000, val)
      : 0;

  const normUnit = typeof unit === 'string' ? unit.trim().toLowerCase() : 'µm';
  const isMm = normUnit === 'mm';
  const dec = typeof decimals === 'number' && Number.isFinite(decimals) ? Math.max(0, Math.min(6, decimals)) : isMm ? 2 : 0;

  if (isMm) {
    const mm = safeMicrons / 1000;
    const rounded = Number(mm.toFixed(dec));
    const safeNum = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeNum.toFixed(dec)} mm`;
  }

  const rounded = Number(safeMicrons.toFixed(dec));
  const safeNum = Object.is(rounded, -0) ? 0 : rounded;
  return `${safeNum.toFixed(dec)} µm`;
}

/**
 * Formatuje wysokość upraw kawy (w metrach n.p.m. lub stopach a.s.l.)
 * z uwzględnieniem lokalizacji językowej (np. '1850 m n.p.m.', '1850 m a.s.l.', '6070 ft a.s.l.')
 * oraz odpornością na ciągi tekstowe, wartości ujemne, -0 i NaN.
 */
export function formatAltitude(
  altitudeMeters: number | string | undefined | null,
  targetUnit: 'm' | 'ft' | string = 'm',
  locale: string = 'pl'
): string {
  const isFt = typeof targetUnit === 'string' && targetUnit.trim().toLowerCase() === 'ft';
  const isEn = typeof locale === 'string' && locale.trim().toLowerCase().startsWith('en');

  if (altitudeMeters === undefined || altitudeMeters === null) {
    const suffix = isEn ? (isFt ? 'ft a.s.l.' : 'm a.s.l.') : (isFt ? 'ft n.p.m.' : 'm n.p.m.');
    return `0 ${suffix}`;
  }

  let val: number;
  if (typeof altitudeMeters === 'number') {
    val = altitudeMeters;
  } else if (typeof altitudeMeters === 'string') {
    const clean = altitudeMeters
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeMeters =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(9000, val)
      : 0;

  if (isFt) {
    const feet = Math.round(safeMeters * 3.28084);
    const suffix = isEn ? 'ft a.s.l.' : 'ft n.p.m.';
    return `${feet} ${suffix}`;
  }

  const meters = Math.round(safeMeters);
  const suffix = isEn ? 'm a.s.l.' : 'm n.p.m.';
  return `${meters} ${suffix}`;
}

/**
 * Formatuje ciśnienie parzenia w barach ('bar') lub funtach na cal kwadratowy ('psi')
 * z pełną sanityzacją wartości liczbowych, zabezpieczeniem przed -0 oraz NaN.
 * 1 bar = 14.50377 psi (w obliczeniach 14.5038).
 */
export function formatPressureWithUnit(
  bars: number | string | undefined | null,
  unit: 'bar' | 'psi' | string = 'bar',
  decimals?: number
): string {
  const normUnit = typeof unit === 'string' ? unit.trim().toLowerCase() : 'bar';
  const isPsi = normUnit === 'psi';
  const dec = typeof decimals === 'number' && Number.isFinite(decimals)
    ? Math.max(0, Math.min(6, decimals))
    : 1;

  if (bars === undefined || bars === null) {
    const val = 0;
    return `${val.toFixed(dec)} ${isPsi ? 'psi' : 'bar'}`;
  }

  let val: number;
  if (typeof bars === 'number') {
    val = bars;
  } else if (typeof bars === 'string') {
    const clean = bars
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeBars =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(30, val)
      : 0;

  if (isPsi) {
    const psiVal = safeBars * 14.5038;
    const rounded = Number(psiVal.toFixed(dec));
    const safeNum = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeNum.toFixed(dec)} psi`;
  }

  const rounded = Number(safeBars.toFixed(dec));
  const safeNum = Object.is(rounded, -0) ? 0 : rounded;
  return `${safeNum.toFixed(dec)} bar`;
}

/**
 * Formatuje czas parzenia w formacie M:SS lub MM:SS (np. 2:30, 0:00, 1:05, 12:45)
 * z pełną sanityzacją wartości liczbowych, zabezpieczeniem przed -0, ujemnymi sekundami oraz NaN.
 */
export function formatBrewTimeMinutesSeconds(
  totalSeconds: number | string | undefined | null,
  showLeadingZeroMinutes: boolean = false
): string {
  if (totalSeconds === undefined || totalSeconds === null) {
    return showLeadingZeroMinutes ? '00:00' : '0:00';
  }

  let val: number;
  if (typeof totalSeconds === 'number') {
    val = totalSeconds;
  } else if (typeof totalSeconds === 'string') {
    const clean = totalSeconds
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeSeconds =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(86400, Math.floor(val))
      : 0;

  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  const minsStr = showLeadingZeroMinutes ? String(mins).padStart(2, '0') : String(mins);
  const secsStr = String(secs).padStart(2, '0');

  return `${minsStr}:${secsStr}`;
}

export type CaffeineUnit = 'mg' | 'g' | 'percent_daily_limit';

/**
 * Formatuje dawkę kofeiny w miligramach ('mg'), gramach ('g') lub w procentach zalecanego dziennego limitu ('percent_daily_limit', RDA).
 * Domyślny dzienny limit wynosi 400 mg (zgodnie ze standardami EFSA / FDA).
 */
export function formatCaffeineDose(
  caffeineMg: number | string | undefined | null,
  unit: CaffeineUnit | string = 'mg',
  dailyMaxMg: number = 400
): string {
  const normUnit = typeof unit === 'string' ? unit.trim().toLowerCase() : 'mg';

  if (caffeineMg === undefined || caffeineMg === null) {
    if (normUnit === 'g') return '0.00 g';
    if (normUnit === 'percent_daily_limit') return '0% RDA';
    return '0 mg';
  }

  let val: number;
  if (typeof caffeineMg === 'number') {
    val = caffeineMg;
  } else if (typeof caffeineMg === 'string') {
    const clean = caffeineMg
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeMg =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(5000, val)
      : 0;

  if (normUnit === 'g') {
    const grams = safeMg / 1000;
    const rounded = Number(grams.toFixed(2));
    const safeGrams = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeGrams.toFixed(2)} g`;
  }

  if (normUnit === 'percent_daily_limit') {
    const safeMax =
      typeof dailyMaxMg === 'number' && Number.isFinite(dailyMaxMg) && dailyMaxMg > 0
        ? dailyMaxMg
        : 400;
    const pct = Math.round((safeMg / safeMax) * 100);
    return `${Math.max(0, pct)}% RDA`;
  }

  const rounded = Math.round(safeMg);
  const safeRounded = Object.is(rounded, -0) ? 0 : rounded;
  return `${safeRounded} mg`;
}

export type WeightDisplayFormat = 'auto' | 'grams' | 'kilograms' | 'ounces' | 'pounds';

/**
 * Formatuje wagę paczki kawy lub całego inwentarza spiżarni z obsługą trybu auto (g/kg lub oz/lbs)
 * oraz wymuszonych formatów ('grams', 'kilograms', 'ounces', 'pounds').
 */
export function formatStashWeight(
  grams: number | string | undefined | null,
  format: WeightDisplayFormat | string = 'auto',
  unitSystem: UnitSystem = 'metric'
): string {
  const normFormat = typeof format === 'string' ? format.trim().toLowerCase() : 'auto';
  const isImperial = unitSystem === 'imperial';

  let val: number;
  if (typeof grams === 'number') {
    val = grams;
  } else if (typeof grams === 'string') {
    const clean = grams
      .replace(/\uFEFF/g, '')
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.')
      .trim();
    val = parseFloat(clean);
  } else {
    val = NaN;
  }

  const safeGrams =
    !Number.isNaN(val) && val >= 0 && !Object.is(val, -0)
      ? Math.min(1000000, val)
      : 0;

  if (normFormat === 'grams') {
    const rounded = Math.round(safeGrams);
    const safeRounded = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeRounded} g`;
  }

  if (normFormat === 'kilograms') {
    const kg = safeGrams / 1000;
    const rounded = Number(kg.toFixed(2));
    const safeKg = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeKg.toFixed(2)} kg`;
  }

  if (normFormat === 'ounces') {
    const oz = safeGrams / 28.349523125;
    const rounded = Number(oz.toFixed(1));
    const safeOz = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeOz.toFixed(1)} oz`;
  }

  if (normFormat === 'pounds') {
    const lbs = safeGrams / 453.59237;
    const rounded = Number(lbs.toFixed(2));
    const safeLbs = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeLbs.toFixed(2)} lbs`;
  }

  // format === 'auto'
  if (isImperial) {
    const oz = safeGrams / 28.349523125;
    if (oz < 16) {
      const rounded = Number(oz.toFixed(1));
      const safeOz = Object.is(rounded, -0) ? 0 : rounded;
      return `${safeOz.toFixed(1)} oz`;
    }
    const lbs = safeGrams / 453.59237;
    const rounded = Number(lbs.toFixed(2));
    const safeLbs = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeLbs.toFixed(2)} lbs`;
  }

  // Metric auto
  if (safeGrams < 1000) {
    const rounded = Math.round(safeGrams);
    const safeRounded = Object.is(rounded, -0) ? 0 : rounded;
    return `${safeRounded} g`;
  }

  const kg = safeGrams / 1000;
  const rounded = Number(kg.toFixed(2));
  const safeKg = Object.is(rounded, -0) ? 0 : rounded;
  return `${safeKg.toFixed(2)} kg`;
}






export interface CostPerCupFormat {
  costPerCup: number;
  costPerCupFormatted: string;
  totalCupsInBag: number;
  costPerGram: number;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Wylicza i formatuje koszt pojedynczej porcji naparu (filiżanki)
 * na podstawie ceny paczki, jej gramatury oraz dozy surowca.
 */
export function formatCostPerCup(
  costPerBag: number | string | undefined | null,
  bagWeightGrams: number | string | undefined | null,
  doseGrams: number | string | undefined | null,
  currencySymbol = 'zł'
): CostPerCupFormat {
  const parseNum = (v: unknown, fallback = 0, min = 0, max = 1000000): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(min, Math.min(max, v)) : fallback;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0)
        ? Math.max(min, Math.min(max, parsed))
        : fallback;
    }
    return fallback;
  };

  const cost = parseNum(costPerBag, 0, 0, 100000);
  const bagWeight = parseNum(bagWeightGrams != null ? bagWeightGrams : 250, 250, 1, 1000000);
  const dose = parseNum(doseGrams != null ? doseGrams : 15, 15, 0.1, 1000);

  const cleanCurrency =
    typeof currencySymbol === 'string' && currencySymbol.trim() ? currencySymbol.trim() : 'zł';

  const costPerGram = bagWeight > 0 ? cost / bagWeight : 0;
  const rawCostPerCup = costPerGram * dose;
  const costPerCup = Number(rawCostPerCup.toFixed(2));
  const safeCostPerCup = Object.is(costPerCup, -0) ? 0 : costPerCup;

  const totalCupsInBag = dose > 0 ? Math.floor(bagWeight / dose) : 0;

  const isPrefixCurrency = ['$', '€', '£', '¥'].includes(cleanCurrency);
  const costPerCupFormatted = isPrefixCurrency
    ? `${cleanCurrency}${safeCostPerCup.toFixed(2)}`
    : `${safeCostPerCup.toFixed(2)} ${cleanCurrency}`;

  const summaryPl = `Koszt porcji naparu: ${costPerCupFormatted} (paczka wystarcza na ${totalCupsInBag} filiżanek przy dozie ${dose}g).`;
  const summaryEn = `Cost per brew: ${costPerCupFormatted} (${totalCupsInBag} cups per bag at ${dose}g dose).`;

  return {
    costPerCup: safeCostPerCup,
    costPerCupFormatted,
    totalCupsInBag,
    costPerGram,
    summaryPl,
    summaryEn,
  };
}
