// ============================================================================
// Napar (Steepwise) — Backup Engine (BR-TEST-022, BR-TEST-023, RD-ENG-12)
// Rotating 10 auto-backups in Documents/Backup/, safety backups before destructive
// operations, separated safety pool, and standardized BackupEnvelope<T> format.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog } from './database-schema';

export const SCHEMA_VERSION = 1;
export const AUTO_DIR = 'Backup/';
export const AUTO_KEEP = 10;

/**
 * Wzorzec nazw kopii automatycznych: napar-[kopia-]RRRR-MM-DD-GGMMSS[-N].json (RD-ENG-12)
 */
export const AUTO_RE = /^napar-(?:kopia-)?(\d{4}-\d{2}-\d{2}-\d{6})(?:-(\d{1,3}))?\.json$/;

/**
 * Wzorzec nazw kopii bezpieczeństwa: napar-przed-(importem|czyszczeniem)-RRRR-MM-DD-GGMMSS[-N].json
 */
export const SAFETY_RE =
  /^napar-przed-(?:importem|czyszczeniem)-(\d{4}-\d{2}-\d{2}-\d{6})(?:-(\d{1,3}))?\.json$/;

export interface NaparBackupData {
  inventory: InventoryItem[];
  customRecipes: SavedRecipe[];
  sessions: BrewSession[];
  caffeineLogs: CaffeineLog[];
  settings?: Record<string, unknown>;
}

export interface NaparBackupEnvelope {
  format: 'napar-backup';
  schemaVersion: number;
  exportedAt: string;
  state: NaparBackupData;
}

export interface CorruptStateRecovery {
  corruptFile: string;
  timestamp: string;
  rawSnippet: string;
}

export function buildBackup(state: NaparBackupData): NaparBackupEnvelope {
  const safeState: NaparBackupData =
    state && typeof state === 'object'
      ? state
      : {
          inventory: [],
          customRecipes: [],
          sessions: [],
          caffeineLogs: [],
        };
  return {
    format: 'napar-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: safeState,
  };
}

export interface BackupStats {
  inventoryCount: number;
  recipesCount: number;
  sessionsCount: number;
  caffeineLogsCount: number;
}

/**
 * Zwraca podsumowanie liczbowe pozycji zawartych w kopii zapasowej.
 */
export function getBackupStats(envelope?: NaparBackupEnvelope | null): BackupStats {
  if (!envelope || !envelope.state || typeof envelope.state !== 'object') {
    return { inventoryCount: 0, recipesCount: 0, sessionsCount: 0, caffeineLogsCount: 0 };
  }
  return {
    inventoryCount: Array.isArray(envelope.state.inventory) ? envelope.state.inventory.length : 0,
    recipesCount: Array.isArray(envelope.state.customRecipes) ? envelope.state.customRecipes.length : 0,
    sessionsCount: Array.isArray(envelope.state.sessions) ? envelope.state.sessions.length : 0,
    caffeineLogsCount: Array.isArray(envelope.state.caffeineLogs) ? envelope.state.caffeineLogs.length : 0,
  };
}

export interface BackupRecordCounts {
  inventoryCount: number;
  recipesCount: number;
  sessionsCount: number;
  caffeineLogsCount: number;
  totalRecords: number;
  exportedAt: string;
}

/**
 * Zwraca szczegółowe statystyki liczby rekordów oraz znacznik czasu wyeksportowania kopii zapasowej.
 */
export function getBackupRecordCounts(
  envelope?: NaparBackupEnvelope | null
): BackupRecordCounts {
  if (!envelope || !envelope.state || typeof envelope.state !== 'object') {
    return {
      inventoryCount: 0,
      recipesCount: 0,
      sessionsCount: 0,
      caffeineLogsCount: 0,
      totalRecords: 0,
      exportedAt: '',
    };
  }

  const inv = Array.isArray(envelope.state.inventory) ? envelope.state.inventory.length : 0;
  const rec = Array.isArray(envelope.state.customRecipes) ? envelope.state.customRecipes.length : 0;
  const ses = Array.isArray(envelope.state.sessions) ? envelope.state.sessions.length : 0;
  const caf = Array.isArray(envelope.state.caffeineLogs) ? envelope.state.caffeineLogs.length : 0;

  return {
    inventoryCount: inv,
    recipesCount: rec,
    sessionsCount: ses,
    caffeineLogsCount: caf,
    totalRecords: inv + rec + ses + caf,
    exportedAt: typeof envelope.exportedAt === 'string' ? envelope.exportedAt.trim() : '',
  };
}

function plItems(n: number): string {
  if (n === 1) return '1 pozycja';
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) return `${n} pozycje`;
  return `${n} pozycji`;
}

function plRecipes(n: number): string {
  if (n === 1) return '1 receptura';
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) return `${n} receptury`;
  return `${n} receptur`;
}

function plSessions(n: number): string {
  if (n === 1) return '1 sesja';
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) return `${n} sesje`;
  return `${n} sesji`;
}

/**
 * Generuje zwięzłe, zlokalizowane podsumowanie zawartości kopii zapasowej.
 */
export function formatBackupSummary(
  envelope?: NaparBackupEnvelope | null,
  language: 'pl' | 'en' | string = 'pl'
): string {
  if (!envelope || !envelope.state || typeof envelope.state !== 'object') {
    return typeof language === 'string' && language.toLowerCase().startsWith('en')
      ? 'No backup data available'
      : 'Brak danych kopii zapasowej';
  }

  const isEn = typeof language === 'string' && language.toLowerCase().startsWith('en');
  const stats = getBackupStats(envelope);
  const dateStr =
    typeof envelope.exportedAt === 'string' && envelope.exportedAt.length >= 10
      ? envelope.exportedAt.slice(0, 10)
      : localISODate();

  if (isEn) {
    const items = `${stats.inventoryCount} ${stats.inventoryCount === 1 ? 'item' : 'items'}`;
    const recipes = `${stats.recipesCount} ${stats.recipesCount === 1 ? 'recipe' : 'recipes'}`;
    const sessions = `${stats.sessionsCount} ${stats.sessionsCount === 1 ? 'session' : 'sessions'}`;
    return `Backup from ${dateStr}: ${items}, ${recipes}, ${sessions}`;
  }

  return `Kopia z ${dateStr}: ${plItems(stats.inventoryCount)}, ${plRecipes(stats.recipesCount)}, ${plSessions(stats.sessionsCount)}`;
}


export function localISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function stampOf(d: Date = new Date()): string {
  const iso = localISODate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${iso}-${hours}${minutes}${seconds}`;
}

export const poolKey = (m: RegExpExecArray): string => `${m[1]}-${(m[2] ?? '1').padStart(3, '0')}`;

/**
 * RD-ENG-12: Algorytm rotacji dwóch rozdzielnych pul kopii zapasowych.
 * Zwraca listę nazw plików do usunięcia z dysku.
 */
export function rotateBackupFiles(
  fileList: string[],
  poolRegex: RegExp,
  keepCount = AUTO_KEEP
): string[] {
  if (!Array.isArray(fileList) || fileList.length === 0) return [];

  const rawKeep = typeof keepCount === 'number' ? keepCount : parseInt(String(keepCount), 10);
  const safeKeep =
    Number.isFinite(rawKeep) && rawKeep >= 0 && !Object.is(rawKeep, -0)
      ? Math.floor(rawKeep)
      : AUTO_KEEP;

  const pool = fileList
    .map((f) => [f, poolRegex.exec(f)] as const)
    .filter((x): x is readonly [string, RegExpExecArray] => !!x[1]);

  if (pool.length <= safeKeep) {
    return [];
  }

  // Sortuj malejąco po dacie/czasie + przyrostku kolizji
  const sorted = pool.sort((a, b) => {
    const keyA = poolKey(a[1]);
    const keyB = poolKey(b[1]);
    return keyA < keyB ? 1 : keyA > keyB ? -1 : 0;
  });

  return sorted.slice(safeKeep).map(([f]) => f);
}

/**
 * Udostępnienie pliku tymczasowego w Caches z gwarantowanym usunięciem w bloku finally.
 */
async function shareTemp(
  name: string,
  body: string,
  opts: { mimeType: string; dialogTitle: string }
): Promise<boolean> {
  const baseDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
  const path = `${baseDir}${name}`;
  try {
    await FileSystem.writeAsStringAsync(path, body);
    if (!(await Sharing.isAvailableAsync())) {
      return false;
    }
    await Sharing.shareAsync(path, opts);
    return true;
  } finally {
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
    } catch {
      // Ignoruj błąd usuwania pliku tymczasowego
    }
  }
}

/**
 * Eksport kopii zapasowej do pliku JSON.
 */
export async function exportBackup(state: NaparBackupData): Promise<boolean> {
  const envelope = buildBackup(state);
  const fileName = `napar-backup-${localISODate()}.json`;
  return await shareTemp(fileName, JSON.stringify(envelope, null, 2), {
    mimeType: 'application/json',
    dialogTitle: 'Kopia zapasowa Napar',
  });
}

/**
 * Zapis kopii zapasowej w katalogu Dokumentów (Backup/...) z rotacją do AUTO_KEEP.
 * Przyrostek kolizji -2, -3 w tej samej sekundzie (RD-ENG-12, RYZ-03).
 */
async function writeBackupFile(
  prefix: string,
  re: RegExp,
  state: NaparBackupData
): Promise<string> {
  const docDir = (FileSystem as any).documentDirectory;
  if (!docDir) {
    throw new Error('Brak katalogu dokumentów aplikacji');
  }

  const dir = `${docDir}${AUTO_DIR}`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const stamp = stampOf(new Date());
  let name = `${prefix}${stamp}.json`;

  for (let n = 2; n < 1000 && (await FileSystem.getInfoAsync(`${dir}${name}`)).exists; n++) {
    name = `${prefix}${stamp}-${n}.json`;
  }

  const envelope = buildBackup(state);
  const targetPath = `${dir}${name}`;
  const tmpPath = `${dir}${name}.tmp`;

  try {
    await FileSystem.writeAsStringAsync(tmpPath, JSON.stringify(envelope, null, 2));
    await FileSystem.moveAsync({ from: tmpPath, to: targetPath });
  } catch (e) {
    try {
      await FileSystem.deleteAsync(tmpPath, { idempotent: true });
    } catch {
      // Ignoruj błąd
    }
    try {
      await FileSystem.deleteAsync(targetPath, { idempotent: true });
    } catch {
      // Ignoruj błąd
    }
    throw e;
  }

  // Rotacja rozdzielnej puli (RD-ENG-12)
  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    const toDelete = rotateBackupFiles(files, re, AUTO_KEEP);
    for (const f of toDelete) {
      await FileSystem.deleteAsync(`${dir}${f}`, { idempotent: true });
    }
  } catch {
    // Nieprzerwana praca przy błędzie czyszczenia
  }

  return targetPath;
}

/**
 * Automatyczna rotacyjna kopia po zakończonym parzeniu (Apps4Brew SEC-09 / T-012).
 */
export async function autoBackup(state: NaparBackupData): Promise<string | null> {
  try {
    return await writeBackupFile('napar-', AUTO_RE, state);
  } catch {
    return null;
  }
}

/**
 * Kopia bezpieczeństwa przed operacjami niszczącymi (import, reset bazy) (BR-TEST-022).
 * Rzuca błąd w razie niepowodzenia zapisu — caller MUSI przerwać operację niszczącą!
 */
export async function safetyBackup(
  kind: 'import' | 'reset',
  state: NaparBackupData
): Promise<string> {
  const prefix = kind === 'import' ? 'napar-przed-importem-' : 'napar-przed-czyszczeniem-';
  return await writeBackupFile(prefix, SAFETY_RE, state);
}

/**
 * BR-TEST-023: Zapis uszkodzonego stanu do pliku ratunkowego state_corrupt_<timestamp>.json
 */
export async function saveCorruptState(rawPayload: string, reason: string): Promise<string> {
  const docDir = (FileSystem as any).documentDirectory;
  if (!docDir) throw new Error('Brak katalogu dokumentów aplikacji');
  const dir = `${docDir}${AUTO_DIR}`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const stamp = stampOf(new Date());
  const name = `state_corrupt_${stamp}.json`;
  const filePath = `${dir}${name}`;
  const envelope = {
    format: 'napar-corrupt-state',
    timestamp: new Date().toISOString(),
    reason,
    recovery: {
      rawPayload,
    },
  };
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(envelope, null, 2));
  return filePath;
}

/**
 * BR-TEST-023: Sprawdzenie czy istnieje zapisany uszkodzony stan po awarii
 */
export async function checkCorruptState(): Promise<CorruptStateRecovery | null> {
  try {
    const docDir = (FileSystem as any).documentDirectory;
    if (!docDir) return null;
    const dir = `${docDir}${AUTO_DIR}`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) return null;
    const files = await FileSystem.readDirectoryAsync(dir);
    const corruptFiles = files.filter((f) => f.startsWith('state_corrupt_')).sort().reverse();
    if (corruptFiles.length === 0) return null;

    const latest = corruptFiles[0];
    const content = await FileSystem.readAsStringAsync(`${dir}${latest}`);
    const parsed = JSON.parse(content);
    return {
      corruptFile: latest,
      timestamp: parsed.timestamp || '',
      rawSnippet: (parsed.recovery?.rawPayload || '').slice(0, 100),
    };
  } catch {
    return null;
  }
}

/**
 * BR-TEST-023: Odrzucenie / wyczyszczenie banera uszkodzonego stanu
 */
export async function dismissCorruptState(fileName: string): Promise<void> {
  try {
    const docDir = (FileSystem as any).documentDirectory;
    if (!docDir) return;
    const path = `${docDir}${AUTO_DIR}${fileName}`;
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch {
    // Ignoruj błąd
  }
}

/**
 * Waliduje poprawność schematu pliku kopii zapasowej.
 */
export function parseAndValidateBackup(rawJson: string): NaparBackupEnvelope {
  if (typeof rawJson !== 'string') {
    throw new Error('Nieprawidłowy format JSON');
  }

  const cleanJson = rawJson.replace(/^\uFEFF/, '').trim();
  if (!cleanJson) {
    throw new Error('Nieprawidłowy format JSON');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('Nieprawidłowy format JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Plik kopii musi być obiektem JSON');
  }

  const envelope = parsed as Partial<NaparBackupEnvelope>;

  if (envelope.format !== 'napar-backup') {
    throw new Error('Nieznany format pliku (oczekiwano "napar-backup")');
  }

  if (
    typeof envelope.schemaVersion !== 'number' ||
    !Number.isInteger(envelope.schemaVersion) ||
    envelope.schemaVersion <= 0 ||
    Object.is(envelope.schemaVersion, -0)
  ) {
    throw new Error('Nieprawidłowa wersja schematu kopii');
  }

  if (envelope.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `Kopia pochodzi z nowszej wersji aplikacji (v${envelope.schemaVersion}). Zaktualizuj aplikację.`
    );
  }

  if (!envelope.state || typeof envelope.state !== 'object') {
    throw new Error('Brak danych stanu (sekcja "state") w pliku kopii');
  }

  const state = envelope.state;
  if (!Array.isArray(state.inventory)) {
    throw new Error('Nieprawidłowa struktura spiżarni ("inventory" musi być tablicą)');
  }
  if (!Array.isArray(state.customRecipes)) {
    throw new Error('Nieprawidłowa struktura przepisów ("customRecipes" musi być tablicą)');
  }
  if (!Array.isArray(state.sessions)) {
    throw new Error('Nieprawidłowa struktura sesji ("sessions" musi być tablicą)');
  }
  if (state.caffeineLogs !== undefined && !Array.isArray(state.caffeineLogs)) {
    throw new Error('Nieprawidłowa struktura logu kofeiny ("caffeineLogs" musi być tablicą)');
  }
  if (
    state.settings !== undefined &&
    (typeof state.settings !== 'object' || state.settings === null || Array.isArray(state.settings))
  ) {
    throw new Error('Nieprawidłowa struktura ustawień ("settings" musi być obiektem)');
  }

  if (
    typeof envelope.exportedAt !== 'string' ||
    !envelope.exportedAt.trim() ||
    isNaN(new Date(envelope.exportedAt).getTime())
  ) {
    throw new Error('Nieprawidłowy lub brakujący znacznik czasu eksportu (exportedAt)');
  }

  return envelope as NaparBackupEnvelope;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  envelope?: NaparBackupEnvelope;
}

/**
 * Bezpiecznie waliduje strukturę koperty kopii zapasowej (jako obiekt lub JSON string),
 * zwracając wynik walidacji bez rzucania wyjątków.
 */
export function validateBackupEnvelope(candidate: unknown): BackupValidationResult {
  if (!candidate) {
    return { isValid: false, error: 'Brak danych do walidacji' };
  }

  let envelope: NaparBackupEnvelope;
  try {
    if (typeof candidate === 'string') {
      envelope = parseAndValidateBackup(candidate);
    } else if (typeof candidate === 'object' && candidate !== null) {
      envelope = parseAndValidateBackup(JSON.stringify(candidate));
    } else {
      return { isValid: false, error: 'Nieprawidłowy typ danych koperty' };
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: err && typeof err.message === 'string' ? err.message : 'Nieprawidłowa koperta kopii',
    };
  }

  return { isValid: true, envelope };
}


export interface BackupFilterOptions {
  includeInventory?: boolean;
  includeRecipes?: boolean;
  includeSessions?: boolean;
  includeCaffeine?: boolean;
}

/**
 * Selektywnie filtruje zawartość koperty kopii zapasowej według wybranych kolekcji danych.
 */
export function filterBackupEnvelope(
  envelope: NaparBackupEnvelope,
  options?: BackupFilterOptions
): NaparBackupEnvelope {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Nieprawidłowa koperta kopii zapasowej');
  }

  const opts = options || {};
  const incInv = opts.includeInventory !== false;
  const incRec = opts.includeRecipes !== false;
  const incSes = opts.includeSessions !== false;
  const incCaf = opts.includeCaffeine !== false;

  const rawState =
    envelope.state && typeof envelope.state === 'object' ? envelope.state : ({} as any);

  return {
    ...envelope,
    state: {
      inventory: incInv && Array.isArray(rawState.inventory) ? [...rawState.inventory] : [],
      customRecipes: incRec && Array.isArray(rawState.customRecipes) ? [...rawState.customRecipes] : [],
      sessions: incSes && Array.isArray(rawState.sessions) ? [...rawState.sessions] : [],
      caffeineLogs: incCaf && Array.isArray(rawState.caffeineLogs) ? [...rawState.caffeineLogs] : [],
      settings: rawState.settings ? { ...rawState.settings } : undefined,
    },
  };
}

export interface BackupDiffResult {
  inventory: { source: number; target: number; delta: number };
  recipes: { source: number; target: number; delta: number };
  sessions: { source: number; target: number; delta: number };
  caffeine: { source: number; target: number; delta: number };
  isIdentical: boolean;
}

/**
 * Porównuje rozmiary kolekcji dwóch kopert kopii zapasowych (np. chmura vs lokalna).
 */
export function diffBackupEnvelopes(
  source?: NaparBackupEnvelope | null,
  target?: NaparBackupEnvelope | null
): BackupDiffResult {
  const getCounts = (env?: NaparBackupEnvelope | null) => {
    if (!env || typeof env !== 'object' || !env.state || typeof env.state !== 'object') {
      return { inv: 0, rec: 0, ses: 0, caf: 0 };
    }
    return {
      inv: Array.isArray(env.state.inventory) ? env.state.inventory.length : 0,
      rec: Array.isArray(env.state.customRecipes) ? env.state.customRecipes.length : 0,
      ses: Array.isArray(env.state.sessions) ? env.state.sessions.length : 0,
      caf: Array.isArray(env.state.caffeineLogs) ? env.state.caffeineLogs.length : 0,
    };
  };

  const s = getCounts(source);
  const t = getCounts(target);

  const deltaInv = t.inv - s.inv;
  const deltaRec = t.rec - s.rec;
  const deltaSes = t.ses - s.ses;
  const deltaCaf = t.caf - s.caf;

  const isIdentical = deltaInv === 0 && deltaRec === 0 && deltaSes === 0 && deltaCaf === 0;

  return {
    inventory: { source: s.inv, target: t.inv, delta: deltaInv },
    recipes: { source: s.rec, target: t.rec, delta: deltaRec },
    sessions: { source: s.ses, target: t.ses, delta: deltaSes },
    caffeine: { source: s.caf, target: t.caf, delta: deltaCaf },
    isIdentical,
  };
}

export interface BackupMergeOptions {
  conflictStrategy?: 'keep_primary' | 'overwrite_primary';
}

/**
 * Scala dwie koperty kopii zapasowych, deduplikując encje według ich identyfikatorów ID.
 */
export function mergeBackupEnvelopes(
  primary: NaparBackupEnvelope,
  incoming: NaparBackupEnvelope,
  options?: BackupMergeOptions
): NaparBackupEnvelope {
  if (!primary || typeof primary !== 'object') {
    throw new Error('Nieprawidłowa koperta podstawowa (primary)');
  }
  if (!incoming || typeof incoming !== 'object') {
    throw new Error('Nieprawidłowa koperta wejściowa (incoming)');
  }

  const strategy =
    options && options.conflictStrategy === 'overwrite_primary'
      ? 'overwrite_primary'
      : 'keep_primary';

  const mergeCollection = <T extends { id?: string }>(
    primList?: T[] | null,
    inList?: T[] | null
  ): T[] => {
    const pArr = Array.isArray(primList) ? primList : [];
    const iArr = Array.isArray(inList) ? inList : [];

    const map = new Map<string, T>();
    const withoutId: T[] = [];

    for (const item of pArr) {
      if (!item || typeof item !== 'object') continue;
      if (item.id && typeof item.id === 'string' && item.id.trim()) {
        map.set(item.id.trim(), item);
      } else {
        withoutId.push(item);
      }
    }

    for (const item of iArr) {
      if (!item || typeof item !== 'object') continue;
      if (item.id && typeof item.id === 'string' && item.id.trim()) {
        const id = item.id.trim();
        if (map.has(id)) {
          if (strategy === 'overwrite_primary') {
            map.set(id, item);
          }
        } else {
          map.set(id, item);
        }
      } else {
        withoutId.push(item);
      }
    }

    return [...Array.from(map.values()), ...withoutId];
  };

  const pState =
    primary.state && typeof primary.state === 'object'
      ? primary.state
      : { inventory: [], customRecipes: [], sessions: [], caffeineLogs: [] };
  const iState =
    incoming.state && typeof incoming.state === 'object'
      ? incoming.state
      : { inventory: [], customRecipes: [], sessions: [], caffeineLogs: [] };

  const mergedInventory = mergeCollection<InventoryItem>(pState.inventory, iState.inventory);
  const mergedRecipes = mergeCollection<SavedRecipe>(pState.customRecipes, iState.customRecipes);
  const mergedSessions = mergeCollection<BrewSession>(pState.sessions, iState.sessions);
  const mergedCaffeine = mergeCollection<CaffeineLog>(pState.caffeineLogs, iState.caffeineLogs);

  return {
    ...primary,
    exportedAt: new Date().toISOString(),
    state: {
      inventory: mergedInventory,
      customRecipes: mergedRecipes,
      sessions: mergedSessions,
      caffeineLogs: mergedCaffeine,
      settings: {
        ...(iState.settings || {}),
        ...(pState.settings || {}),
      },
    },
  };
}


/**
 * Sprawdza, czy koperta kopii zapasowej jest pusta (brak danych lub zerowa liczba encji
 * we wszystkich 4 kolekcjach: inwentarz, receptury, sesje, logi kofeiny).
 */
export function isBackupEmpty(envelope?: NaparBackupEnvelope | null): boolean {
  if (!envelope || typeof envelope !== 'object' || !envelope.state || typeof envelope.state !== 'object') {
    return true;
  }

  const inv = Array.isArray(envelope.state.inventory) ? envelope.state.inventory.length : 0;
  const rec = Array.isArray(envelope.state.customRecipes) ? envelope.state.customRecipes.length : 0;
  const ses = Array.isArray(envelope.state.sessions) ? envelope.state.sessions.length : 0;
  const caf = Array.isArray(envelope.state.caffeineLogs) ? envelope.state.caffeineLogs.length : 0;

  return inv + rec + ses + caf === 0;
}


export interface BackupIntegrityReport {
  isValid: boolean;
  schemaVersion: number;
  totalRecords: number;
  inventoryCount: number;
  recipesCount: number;
  sessionsCount: number;
  caffeineLogsCount: number;
  issues: string[];
  exportedAtIso: string;
}

/**
 * Dokonuje szczegółowego audytu integralności struktury kopii zapasowej,
 * weryfikując wersję schematu, zgodność aplikacji, typy kolekcji oraz poprawność rekordów.
 */
export function validateBackupEnvelopeIntegrity(candidate: unknown): BackupIntegrityReport {
  const issues: string[] = [];

  if (!candidate) {
    return {
      isValid: false,
      schemaVersion: 0,
      totalRecords: 0,
      inventoryCount: 0,
      recipesCount: 0,
      sessionsCount: 0,
      caffeineLogsCount: 0,
      issues: ['Brak danych koperty kopii zapasowej'],
      exportedAtIso: '',
    };
  }

  let obj: any;
  if (typeof candidate === 'string') {
    try {
      obj = JSON.parse(candidate);
    } catch {
      return {
        isValid: false,
        schemaVersion: 0,
        totalRecords: 0,
        inventoryCount: 0,
        recipesCount: 0,
        sessionsCount: 0,
        caffeineLogsCount: 0,
        issues: ['Błąd parsowania JSON: niepoprawna składnia'],
        exportedAtIso: '',
      };
    }
  } else if (typeof candidate === 'object' && candidate !== null) {
    obj = candidate;
  } else {
    return {
      isValid: false,
      schemaVersion: 0,
      totalRecords: 0,
      inventoryCount: 0,
      recipesCount: 0,
      sessionsCount: 0,
      caffeineLogsCount: 0,
      issues: ['Nieprawidłowy typ wejściowy koperty (oczekiwano obiektu lub JSON string)'],
      exportedAtIso: '',
    };
  }

  if (obj.format !== 'napar-backup') {
    issues.push(`Niepoprawny format pliku: oczekiwano "napar-backup", otrzymano "${obj.format}"`);
  }

  const ver = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : typeof obj.version === 'number' ? obj.version : 0;
  if (ver !== SCHEMA_VERSION) {
    issues.push(`Nieobsługiwana wersja schematu: oczekiwano ${SCHEMA_VERSION}, otrzymano ${ver}`);
  }

  const exportedAtIso = typeof obj.exportedAt === 'string' ? obj.exportedAt : '';

  const state = obj.state || obj.data;
  if (!state || typeof state !== 'object') {
    issues.push('Brak kontenera danych ("state" lub "data")');
    return {
      isValid: false,
      schemaVersion: ver,
      totalRecords: 0,
      inventoryCount: 0,
      recipesCount: 0,
      sessionsCount: 0,
      caffeineLogsCount: 0,
      issues,
      exportedAtIso,
    };
  }

  const checkCollection = (name: string, arr: any): number => {
    if (!Array.isArray(arr)) {
      issues.push(`Kolekcja "${name}" nie jest poprawną tablicą`);
      return 0;
    }
    return arr.length;
  };

  const inventoryCount = checkCollection('inventory', state.inventory);
  const recipesCount = checkCollection('customRecipes', state.customRecipes || state.recipes);
  const sessionsCount = checkCollection('sessions', state.sessions);
  const caffeineLogsCount = checkCollection('caffeineLogs', state.caffeineLogs || state.caffeine);

  const totalRecords = inventoryCount + recipesCount + sessionsCount + caffeineLogsCount;
  const isValid = issues.length === 0;

  return {
    isValid,
    schemaVersion: ver,
    totalRecords,
    inventoryCount,
    recipesCount,
    sessionsCount,
    caffeineLogsCount,
    issues,
    exportedAtIso,
  };
}

/**
 * Sanityzuje i normalizuje nieznaną strukturę kopii zapasowej do kanonicznego formatu NaparBackupEnvelope.
 * Naprawia brakujące lub uszkodzone kolekcje (inventory, customRecipes/recipes, sessions, caffeineLogs),
 * migruje dane z kontenera legacy .data do .state, filtruje uszkodzone rekordy (wymagające id i obiektu)
 * oraz uzupełnia brakujące metadane koperty.
 */
export function sanitizeBackupEnvelope(candidate: unknown): NaparBackupEnvelope {
  const defaultEmptyState: NaparBackupData = {
    inventory: [],
    customRecipes: [],
    sessions: [],
    caffeineLogs: [],
    settings: {},
  };

  const defaultEnvelope: NaparBackupEnvelope = {
    format: 'napar-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: defaultEmptyState,
  };

  if (!candidate || typeof candidate !== 'object') {
    return defaultEnvelope;
  }

  const obj = candidate as Record<string, any>;
  const rawState = obj.state && typeof obj.state === 'object' ? obj.state : obj.data && typeof obj.data === 'object' ? obj.data : obj;

  const sanitizeArray = <T extends { id?: any }>(arr: unknown): T[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item): item is T => {
      return item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0;
    });
  };

  const sanitizedInventory = sanitizeArray<InventoryItem>(rawState.inventory);
  const rawRecipes = rawState.customRecipes || rawState.recipes;
  const sanitizedRecipes = sanitizeArray<SavedRecipe>(rawRecipes);
  const sanitizedSessions = sanitizeArray<BrewSession>(rawState.sessions);
  const sanitizedCaffeine = sanitizeArray<CaffeineLog>(rawState.caffeineLogs || rawState.caffeine);

  const rawSettings = rawState.settings;
  const sanitizedSettings: Record<string, unknown> =
    rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings) ? { ...rawSettings } : {};

  const schemaVersion =
    typeof obj.schemaVersion === 'number' && Number.isFinite(obj.schemaVersion) && obj.schemaVersion > 0
      ? Math.floor(obj.schemaVersion)
      : SCHEMA_VERSION;

  const exportedAt =
    typeof obj.exportedAt === 'string' && obj.exportedAt.trim()
      ? obj.exportedAt.trim()
      : new Date().toISOString();

  return {
    format: 'napar-backup',
    schemaVersion,
    exportedAt,
    state: {
      inventory: sanitizedInventory,
      customRecipes: sanitizedRecipes,
      sessions: sanitizedSessions,
      caffeineLogs: sanitizedCaffeine,
      settings: sanitizedSettings,
    },
  };
}

export interface BackupFileSizeEstimate {
  estimatedBytes: number;
  estimatedKilobytes: number;
  formattedSize: string;
  collectionBreakdownBytes: {
    inventory: number;
    recipes: number;
    sessions: number;
    caffeine: number;
    metadata: number;
  };
  collectionBreakdownPercent: {
    inventory: number;
    recipes: number;
    sessions: number;
    caffeine: number;
    metadata: number;
  };
}

/**
 * Szacuje rozmiar pliku kopii zapasowej w bajtach i kilobajtach oraz rozbicie wagowe
 * na poszczególne kolekcje (inventory, customRecipes, sessions, caffeineLogs, metadane).
 */
export function estimateBackupFileSize(
  envelope?: NaparBackupEnvelope | null
): BackupFileSizeEstimate {
  const zeroBreakdown = {
    inventory: 0,
    recipes: 0,
    sessions: 0,
    caffeine: 0,
    metadata: 0,
  };

  if (!envelope || typeof envelope !== 'object') {
    return {
      estimatedBytes: 0,
      estimatedKilobytes: 0,
      formattedSize: '0 B',
      collectionBreakdownBytes: { ...zeroBreakdown },
      collectionBreakdownPercent: { ...zeroBreakdown },
    };
  }

  let totalJson = '';
  try {
    totalJson = JSON.stringify(envelope) || '';
  } catch {
    return {
      estimatedBytes: 0,
      estimatedKilobytes: 0,
      formattedSize: '0 B',
      collectionBreakdownBytes: { ...zeroBreakdown },
      collectionBreakdownPercent: { ...zeroBreakdown },
    };
  }

  const estimatedBytes = typeof Buffer !== 'undefined' && Buffer.byteLength
    ? Buffer.byteLength(totalJson, 'utf8')
    : totalJson.length;

  if (estimatedBytes === 0) {
    return {
      estimatedBytes: 0,
      estimatedKilobytes: 0,
      formattedSize: '0 B',
      collectionBreakdownBytes: { ...zeroBreakdown },
      collectionBreakdownPercent: { ...zeroBreakdown },
    };
  }

  const rawState =
    envelope.state && typeof envelope.state === 'object'
      ? envelope.state
      : (envelope as any).data && typeof (envelope as any).data === 'object'
      ? (envelope as any).data
      : {};

  const getBytes = (val: unknown): number => {
    try {
      const s = JSON.stringify(val || []);
      return typeof Buffer !== 'undefined' && Buffer.byteLength ? Buffer.byteLength(s, 'utf8') : s.length;
    } catch {
      return 0;
    }
  };

  const invBytes = getBytes(rawState.inventory);
  const recBytes = getBytes(rawState.customRecipes || rawState.recipes);
  const sesBytes = getBytes(rawState.sessions);
  const cafBytes = getBytes(rawState.caffeineLogs || rawState.caffeine);

  const sumCollections = invBytes + recBytes + sesBytes + cafBytes;
  const metaBytes = Math.max(0, estimatedBytes - sumCollections);

  const estimatedKilobytes = Number((estimatedBytes / 1024).toFixed(1));

  let formattedSize: string;
  if (estimatedBytes < 1024) {
    formattedSize = `${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    formattedSize = `${(estimatedBytes / 1024).toFixed(1)} KB`;
  } else {
    formattedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const calcPercent = (bytes: number): number => {
    return Math.max(0, Math.min(100, Math.round((bytes / estimatedBytes) * 100)));
  };

  return {
    estimatedBytes,
    estimatedKilobytes: Object.is(estimatedKilobytes, -0) ? 0 : estimatedKilobytes,
    formattedSize,
    collectionBreakdownBytes: {
      inventory: invBytes,
      recipes: recBytes,
      sessions: sesBytes,
      caffeine: cafBytes,
      metadata: metaBytes,
    },
    collectionBreakdownPercent: {
      inventory: calcPercent(invBytes),
      recipes: calcPercent(recBytes),
      sessions: calcPercent(sesBytes),
      caffeine: calcPercent(cafBytes),
      metadata: calcPercent(metaBytes),
    },
  };
}

export type BackupComparisonStatus =
  | 'identical'
  | 'local_ahead'
  | 'remote_ahead'
  | 'divergent_conflict'
  | 'corrupt';

export interface BackupVersionComparison {
  status: BackupComparisonStatus;
  localExportedAt: string | null;
  remoteExportedAt: string | null;
  localItemCount: number;
  remoteItemCount: number;
  differenceItemCount: number;
  recommendedAction: 'keep_local' | 'restore_remote' | 'merge_required' | 'reject';
  summaryMessagePl: string;
  summaryMessageEn: string;
}

/**
 * Porównuje wersje dwóch kopert kopii zapasowej (np. lokalnej i importowanej/chmurowej)
 * i wykrywa czy kopie są identyczne, nowsze, czy występuje konflikt wersji.
 */
export function compareBackupVersions(
  localEnvelope?: unknown,
  remoteEnvelope?: unknown
): BackupVersionComparison {
  const isEnvValid = (env: unknown): env is NaparBackupEnvelope => {
    if (!env || typeof env !== 'object') return false;
    const e = env as Record<string, unknown>;
    return (
      (e.format === 'napar-backup' || typeof e.version === 'number') &&
      (Boolean(e.state && typeof e.state === 'object') || Boolean(e.data && typeof e.data === 'object'))
    );
  };

  const getCounts = (env: unknown): { count: number; exportedAt: string | null; timeMs: number } => {
    if (!env || typeof env !== 'object') return { count: 0, exportedAt: null, timeMs: NaN };
    const e = env as any;
    const state =
      e.state && typeof e.state === 'object'
        ? e.state
        : e.data && typeof e.data === 'object'
        ? e.data
        : {};
    const inv = Array.isArray(state.inventory) ? state.inventory.length : 0;
    const rec = Array.isArray(state.customRecipes || state.recipes)
      ? (state.customRecipes || state.recipes).length
      : 0;
    const ses = Array.isArray(state.sessions) ? state.sessions.length : 0;
    const caf = Array.isArray(state.caffeineLogs || state.caffeine)
      ? (state.caffeineLogs || state.caffeine).length
      : 0;
    const exportedAt =
      typeof e.exportedAt === 'string' && e.exportedAt.trim().length > 0
        ? e.exportedAt.trim()
        : null;
    const timeMs = exportedAt ? Date.parse(exportedAt) : NaN;
    return { count: inv + rec + ses + caf, exportedAt, timeMs };
  };

  const localValid = isEnvValid(localEnvelope);
  const remoteValid = isEnvValid(remoteEnvelope);

  if (!localValid && !remoteValid) {
    return {
      status: 'corrupt',
      localExportedAt: null,
      remoteExportedAt: null,
      localItemCount: 0,
      remoteItemCount: 0,
      differenceItemCount: 0,
      recommendedAction: 'reject',
      summaryMessagePl: 'Obie kopie zapasowe są uszkodzone lub nieprawidłowe.',
      summaryMessageEn: 'Both backup files are corrupt or invalid.',
    };
  }

  const localInfo = getCounts(localEnvelope);
  const remoteInfo = getCounts(remoteEnvelope);

  if (!localValid && remoteValid) {
    return {
      status: 'remote_ahead',
      localExportedAt: null,
      remoteExportedAt: remoteInfo.exportedAt,
      localItemCount: 0,
      remoteItemCount: remoteInfo.count,
      differenceItemCount: -remoteInfo.count,
      recommendedAction: 'restore_remote',
      summaryMessagePl: 'Lokalna kopia jest uszkodzona — zalecane przywrócenie ze zdalnej kopii.',
      summaryMessageEn: 'Local backup is corrupt — restoring from remote backup is recommended.',
    };
  }

  if (localValid && !remoteValid) {
    return {
      status: 'local_ahead',
      localExportedAt: localInfo.exportedAt,
      remoteExportedAt: null,
      localItemCount: localInfo.count,
      remoteItemCount: 0,
      differenceItemCount: localInfo.count,
      recommendedAction: 'keep_local',
      summaryMessagePl: 'Zdalna kopia jest uszkodzona — zalecane zachowanie lokalnych danych.',
      summaryMessageEn: 'Remote backup is corrupt — keeping local data is recommended.',
    };
  }

  const diffItems = localInfo.count - remoteInfo.count;
  const isTimeEqual =
    localInfo.exportedAt === remoteInfo.exportedAt ||
    (!Number.isNaN(localInfo.timeMs) &&
      !Number.isNaN(remoteInfo.timeMs) &&
      localInfo.timeMs === remoteInfo.timeMs);

  if (isTimeEqual && diffItems === 0) {
    return {
      status: 'identical',
      localExportedAt: localInfo.exportedAt,
      remoteExportedAt: remoteInfo.exportedAt,
      localItemCount: localInfo.count,
      remoteItemCount: remoteInfo.count,
      differenceItemCount: 0,
      recommendedAction: 'keep_local',
      summaryMessagePl: 'Obie kopie zapasowe są identyczne pod względem daty i liczby rekordów.',
      summaryMessageEn: 'Both backups are identical in timestamp and item count.',
    };
  }

  const hasValidTimes = !Number.isNaN(localInfo.timeMs) && !Number.isNaN(remoteInfo.timeMs);

  if (hasValidTimes) {
    if (localInfo.timeMs > remoteInfo.timeMs && diffItems >= 0) {
      return {
        status: 'local_ahead',
        localExportedAt: localInfo.exportedAt,
        remoteExportedAt: remoteInfo.exportedAt,
        localItemCount: localInfo.count,
        remoteItemCount: remoteInfo.count,
        differenceItemCount: diffItems,
        recommendedAction: 'keep_local',
        summaryMessagePl: `Lokalna kopia jest nowsza (+${diffItems} rekordów). Zalecane zachowanie lokalnych danych.`,
        summaryMessageEn: `Local backup is newer (+${diffItems} items). Keeping local data recommended.`,
      };
    }

    if (remoteInfo.timeMs > localInfo.timeMs && diffItems <= 0) {
      return {
        status: 'remote_ahead',
        localExportedAt: localInfo.exportedAt,
        remoteExportedAt: remoteInfo.exportedAt,
        localItemCount: localInfo.count,
        remoteItemCount: remoteInfo.count,
        differenceItemCount: diffItems,
        recommendedAction: 'restore_remote',
        summaryMessagePl: `Zdalna kopia jest nowsza (+${Math.abs(diffItems)} rekordów). Zalecane przywrócenie ze zdalnej kopii.`,
        summaryMessageEn: `Remote backup is newer (+${Math.abs(diffItems)} items). Restoring remote backup recommended.`,
      };
    }
  }

  return {
    status: 'divergent_conflict',
    localExportedAt: localInfo.exportedAt,
    remoteExportedAt: remoteInfo.exportedAt,
    localItemCount: localInfo.count,
    remoteItemCount: remoteInfo.count,
    differenceItemCount: diffItems,
    recommendedAction: 'merge_required',
    summaryMessagePl: 'Wykryto rozbieżność danych między kopiami (konflikt wersji). Zalecane scalenie.',
    summaryMessageEn: 'Data divergence detected between backup copies (version conflict). Merge recommended.',
  };
}

export interface BackupMigrationStep {
  collection: 'inventory' | 'customRecipes' | 'sessions' | 'caffeineLogs' | 'settings';
  action: 'migrate_schema' | 'fill_defaults' | 'noop';
  itemCount: number;
  detailsPl: string;
  detailsEn: string;
}

export interface BackupMigrationPlan {
  fromSchemaVersion: number;
  toSchemaVersion: number;
  isMigrationRequired: boolean;
  canSafelyMigrate: boolean;
  steps: BackupMigrationStep[];
  totalItemsToMigrate: number;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Generuje szczegółowy plan migracji struktury kopii zapasowej do bieżącej wersji schematu aplikacji.
 */
export function generateBackupMigrationPlan(envelope?: unknown): BackupMigrationPlan {
  if (!envelope || typeof envelope !== 'object') {
    return {
      fromSchemaVersion: 0,
      toSchemaVersion: SCHEMA_VERSION,
      isMigrationRequired: false,
      canSafelyMigrate: false,
      steps: [],
      totalItemsToMigrate: 0,
      summaryPl: 'Nieprawidłowa lub uszkodzona koperta kopii zapasowej — migracja niemożliwa.',
      summaryEn: 'Invalid or corrupt backup envelope — migration impossible.',
    };
  }

  const env = envelope as Partial<NaparBackupEnvelope>;
  if (env.format !== 'napar-backup') {
    return {
      fromSchemaVersion: typeof env.schemaVersion === 'number' ? env.schemaVersion : 0,
      toSchemaVersion: SCHEMA_VERSION,
      isMigrationRequired: false,
      canSafelyMigrate: false,
      steps: [],
      totalItemsToMigrate: 0,
      summaryPl: 'Nieprawidłowy format kopii (oczekiwano napar-backup) — uszkodzona koperta.',
      summaryEn: 'Invalid backup format (expected napar-backup) — corrupt envelope.',
    };
  }

  const fromVersion =
    typeof env.schemaVersion === 'number' && Number.isFinite(env.schemaVersion)
      ? env.schemaVersion
      : 0;
  const toVersion = SCHEMA_VERSION;

  if (fromVersion > toVersion) {
    return {
      fromSchemaVersion: fromVersion,
      toSchemaVersion: toVersion,
      isMigrationRequired: false,
      canSafelyMigrate: false,
      steps: [],
      totalItemsToMigrate: 0,
      summaryPl: `Kopia pochodzi z nowszej wersji schematu (v${fromVersion} vs v${toVersion}). Wymagana aktualizacja aplikacji.`,
      summaryEn: `Backup comes from a newer schema version (v${fromVersion} vs v${toVersion}). App update required.`,
    };
  }

  const state = env.state && typeof env.state === 'object' ? env.state : ({} as Partial<NaparBackupData>);
  const inventoryCount = Array.isArray(state.inventory) ? state.inventory.length : 0;
  const recipesCount = Array.isArray(state.customRecipes) ? state.customRecipes.length : 0;
  const sessionsCount = Array.isArray(state.sessions) ? state.sessions.length : 0;
  const caffeineCount = Array.isArray(state.caffeineLogs) ? state.caffeineLogs.length : 0;
  const settingsCount =
    state.settings && typeof state.settings === 'object' && !Array.isArray(state.settings)
      ? Object.keys(state.settings).length
      : 0;

  if (fromVersion === toVersion) {
    const steps: BackupMigrationStep[] = [
      {
        collection: 'inventory',
        action: 'noop',
        itemCount: inventoryCount,
        detailsPl: `Kolekcja spiżarni zgodna z bieżącą wersją v${toVersion} (${inventoryCount} elementów).`,
        detailsEn: `Inventory collection matches current v${toVersion} (${inventoryCount} items).`,
      },
      {
        collection: 'customRecipes',
        action: 'noop',
        itemCount: recipesCount,
        detailsPl: `Kolekcja przepisów zgodna z bieżącą wersją v${toVersion} (${recipesCount} elementów).`,
        detailsEn: `Recipes collection matches current v${toVersion} (${recipesCount} items).`,
      },
      {
        collection: 'sessions',
        action: 'noop',
        itemCount: sessionsCount,
        detailsPl: `Kolekcja sesji zgodna z bieżącą wersją v${toVersion} (${sessionsCount} elementów).`,
        detailsEn: `Sessions collection matches current v${toVersion} (${sessionsCount} items).`,
      },
      {
        collection: 'caffeineLogs',
        action: 'noop',
        itemCount: caffeineCount,
        detailsPl: `Kolekcja logów kofeiny zgodna z bieżącą wersją v${toVersion} (${caffeineCount} elementów).`,
        detailsEn: `Caffeine logs collection matches current v${toVersion} (${caffeineCount} items).`,
      },
      {
        collection: 'settings',
        action: 'noop',
        itemCount: settingsCount,
        detailsPl: `Ustawienia zgodne z bieżącą wersją v${toVersion} (${settingsCount} kluczy).`,
        detailsEn: `Settings match current v${toVersion} (${settingsCount} keys).`,
      },
    ];

    return {
      fromSchemaVersion: fromVersion,
      toSchemaVersion: toVersion,
      isMigrationRequired: false,
      canSafelyMigrate: true,
      steps,
      totalItemsToMigrate: 0,
      summaryPl: `Kopia jest w pełni zgodna z bieżącym schematem (v${toVersion}). Migracja nie jest wymagana.`,
      summaryEn: `Backup is fully compatible with current schema (v${toVersion}). No migration required.`,
    };
  }

  // fromVersion < toVersion
  const steps: BackupMigrationStep[] = [
    {
      collection: 'inventory',
      action: inventoryCount > 0 ? 'migrate_schema' : 'noop',
      itemCount: inventoryCount,
      detailsPl:
        inventoryCount > 0
          ? `Migracja schematu ${inventoryCount} pozycji spiżarni (uzupełnienie brakujących typów napojów i statusów).`
          : 'Brak pozycji w spiżarni do migracji.',
      detailsEn:
        inventoryCount > 0
          ? `Migrating schema for ${inventoryCount} inventory items (filling beverage types and statuses).`
          : 'No inventory items to migrate.',
    },
    {
      collection: 'customRecipes',
      action: recipesCount > 0 ? 'migrate_schema' : 'noop',
      itemCount: recipesCount,
      detailsPl:
        recipesCount > 0
          ? `Migracja schematu ${recipesCount} przepisów użytkownika (normalizacja kroków i ratio).`
          : 'Brak przepisów do migracji.',
      detailsEn:
        recipesCount > 0
          ? `Migrating schema for ${recipesCount} custom recipes (normalizing steps and ratio).`
          : 'No custom recipes to migrate.',
    },
    {
      collection: 'sessions',
      action: sessionsCount > 0 ? 'migrate_schema' : 'noop',
      itemCount: sessionsCount,
      detailsPl:
        sessionsCount > 0
          ? `Migracja ${sessionsCount} sesji parzenia (uzupełnienie domyślnych pól sensorycznych).`
          : 'Brak sesji do migracji.',
      detailsEn:
        sessionsCount > 0
          ? `Migrating ${sessionsCount} brew sessions (populating default sensory fields).`
          : 'No brew sessions to migrate.',
    },
    {
      collection: 'caffeineLogs',
      action: caffeineCount > 0 ? 'fill_defaults' : 'noop',
      itemCount: caffeineCount,
      detailsPl:
        caffeineCount > 0
          ? `Uzupełnienie domyślnych wartości dla ${caffeineCount} wpisów logu kofeiny.`
          : 'Brak wpisów kofeiny do migracji.',
      detailsEn:
        caffeineCount > 0
          ? `Filling defaults for ${caffeineCount} caffeine entries.`
          : 'No caffeine logs to migrate.',
    },
    {
      collection: 'settings',
      action: 'fill_defaults',
      itemCount: settingsCount,
      detailsPl: `Uzupełnienie brakujących flag konfiguracji aplikacji (${settingsCount} istniejących kluczy).`,
      detailsEn: `Filling missing app configuration flags (${settingsCount} existing keys).`,
    },
  ];

  const totalItemsToMigrate = inventoryCount + recipesCount + sessionsCount + caffeineCount;

  return {
    fromSchemaVersion: fromVersion,
    toSchemaVersion: toVersion,
    isMigrationRequired: true,
    canSafelyMigrate: true,
    steps,
    totalItemsToMigrate,
    summaryPl: `Wykryto starszą wersję schematu (v${fromVersion} -> v${toVersion}). Przygotowano plan migracji (${totalItemsToMigrate} rekordów).`,
    summaryEn: `Older schema version detected (v${fromVersion} -> v${toVersion}). Prepared migration plan (${totalItemsToMigrate} records).`,
  };
}



