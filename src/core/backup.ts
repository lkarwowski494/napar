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

export type BackupHealthGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';

export interface BackupHealthScore {
  score: number;
  grade: BackupHealthGrade;
  issues: string[];
  totalRecords: number;
  hasInventory: boolean;
  hasCustomRecipes: boolean;
  hasSessions: boolean;
  summaryPl: string;
  summaryEn: string;
}

export function calculateBackupHealthScore(envelope?: unknown): BackupHealthScore {
  if (!envelope || typeof envelope !== 'object') {
    return {
      score: 0,
      grade: 'invalid',
      issues: ['Kopia zapasowa jest pusta lub uszkodzona (brak obiektu JSON)'],
      totalRecords: 0,
      hasInventory: false,
      hasCustomRecipes: false,
      hasSessions: false,
      summaryPl: 'Kopia jest uszkodzona lub ma nieprawidłowy format.',
      summaryEn: 'Backup is corrupted or has an invalid format.',
    };
  }

  const env = envelope as Record<string, unknown>;
  const issues: string[] = [];
  let score = 100;

  if (env.format !== 'napar-backup') {
    issues.push('Nieprawidłowy nagłówek formatu (oczekiwano napar-backup)');
    score -= 40;
  }

  if (
    typeof env.schemaVersion !== 'number' ||
    !Number.isInteger(env.schemaVersion) ||
    env.schemaVersion <= 0
  ) {
    issues.push('Nieprawidłowa lub brakująca wersja schematu (schemaVersion)');
    score -= 20;
  }

  if (typeof env.exportedAt !== 'string' || isNaN(Date.parse(env.exportedAt))) {
    issues.push('Nieprawidłowy znacznik czasu eksportu (exportedAt)');
    score -= 15;
  }

  if (!env.state || typeof env.state !== 'object' || Array.isArray(env.state)) {
    issues.push('Brakujący lub uszkodzony stan danych (pole state)');
    score -= 50;
    const finalScore = Math.max(0, score);
    return {
      score: finalScore,
      grade: finalScore === 0 ? 'invalid' : 'poor',
      issues,
      totalRecords: 0,
      hasInventory: false,
      hasCustomRecipes: false,
      hasSessions: false,
      summaryPl: 'Kopia zapasowa zawiera uszkodzoną strukturę danych.',
      summaryEn: 'Backup contains a corrupted data structure.',
    };
  }

  const state = env.state as Record<string, unknown>;
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const customRecipes = Array.isArray(state.customRecipes) ? state.customRecipes : [];
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  const caffeineLogs = Array.isArray(state.caffeineLogs) ? state.caffeineLogs : [];

  const hasInventory = inventory.length > 0;
  const hasCustomRecipes = customRecipes.length > 0;
  const hasSessions = sessions.length > 0;
  const totalRecords =
    inventory.length + customRecipes.length + sessions.length + caffeineLogs.length;

  if (totalRecords === 0) {
    issues.push('Kopia zapasowa jest pusta (brak jakichkolwiek rekordów)');
    score = Math.min(score, 60);
  }

  score = Math.max(0, Math.min(100, score));

  let grade: BackupHealthGrade = 'invalid';
  let summaryPl = '';
  let summaryEn = '';

  if (score >= 90) {
    grade = 'excellent';
    summaryPl = `Stan doskonały (${score}/100) — kopia jest w pełni spójna, zawiera ${totalRecords} rekordów.`;
    summaryEn = `Excellent health (${score}/100) — backup is fully consistent with ${totalRecords} records.`;
  } else if (score >= 75) {
    grade = 'good';
    summaryPl = `Stan dobry (${score}/100) — kopia jest poprawna, z drobnymi uwagami.`;
    summaryEn = `Good health (${score}/100) — backup is valid with minor remarks.`;
  } else if (score >= 50) {
    grade = 'fair';
    summaryPl = `Stan zadowalający (${score}/100) — kopia zawiera ostrzeżenia lub brak rekordów.`;
    summaryEn = `Fair health (${score}/100) — backup has warnings or contains no records.`;
  } else if (score > 0) {
    grade = 'poor';
    summaryPl = `Słaba kondycja (${score}/100) — wykryto istotne problemy ze strukturą.`;
    summaryEn = `Poor health (${score}/100) — significant structural problems detected.`;
  } else {
    grade = 'invalid';
    summaryPl = 'Kopia jest uszkodzona lub ma nieprawidłowy format.';
    summaryEn = 'Backup is corrupted or has an invalid format.';
  }

  return {
    score,
    grade,
    issues,
    totalRecords,
    hasInventory,
    hasCustomRecipes,
    hasSessions,
    summaryPl,
    summaryEn,
  };
}





export interface CompactBackupResult {
  compactedEnvelope: unknown;
  originalRecordCount: number;
  compactedRecordCount: number;
  removedDuplicatesCount: number;
  cleanedFieldsCount: number;
  summaryPl: string;
  summaryEn: string;
}

export function compactBackupEnvelope(envelope?: unknown): CompactBackupResult {
  if (!envelope || typeof envelope !== 'object') {
    return {
      compactedEnvelope: null,
      originalRecordCount: 0,
      compactedRecordCount: 0,
      removedDuplicatesCount: 0,
      cleanedFieldsCount: 0,
      summaryPl: 'Nieprawidłowa koperta kopii zapasowej.',
      summaryEn: 'Invalid backup envelope.',
    };
  }

  const env = envelope as Record<string, unknown>;
  const state =
    env.state && typeof env.state === 'object' && !Array.isArray(env.state)
      ? (env.state as Record<string, unknown>)
      : null;

  if (!state) {
    return {
      compactedEnvelope: { ...env },
      originalRecordCount: 0,
      compactedRecordCount: 0,
      removedDuplicatesCount: 0,
      cleanedFieldsCount: 0,
      summaryPl: 'Nieprawidłowa struktura danych stanu kopii zapasowej.',
      summaryEn: 'Invalid backup state data structure.',
    };
  }

  let cleanedFieldsCount = 0;
  let removedDuplicatesCount = 0;
  let originalRecordCount = 0;

  function compactCollection(arr: unknown[]): any[] {
    const seenIds = new Set<string>();
    const result: any[] = [];

    for (const item of arr) {
      originalRecordCount++;
      if (!item || typeof item !== 'object') {
        continue;
      }

      const rec = { ...(item as Record<string, unknown>) };
      const id =
        typeof rec.id === 'string' || typeof rec.id === 'number' ? String(rec.id).trim() : '';

      if (id) {
        if (seenIds.has(id)) {
          removedDuplicatesCount++;
          continue;
        }
        seenIds.add(id);
      }

      for (const [key, val] of Object.entries(rec)) {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed !== val) {
            cleanedFieldsCount++;
            rec[key] = trimmed;
          }
        }
      }

      result.push(rec);
    }

    return result;
  }

  const rawInv = Array.isArray(state.inventory) ? state.inventory : [];
  const rawRec = Array.isArray(state.customRecipes) ? state.customRecipes : [];
  const rawSes = Array.isArray(state.sessions) ? state.sessions : [];
  const rawCaf = Array.isArray(state.caffeineLogs) ? state.caffeineLogs : [];

  const compactedInventory = compactCollection(rawInv);
  const compactedRecipes = compactCollection(rawRec);
  const compactedSessions = compactCollection(rawSes);
  const compactedCaffeine = compactCollection(rawCaf);

  const compactedRecordCount =
    compactedInventory.length +
    compactedRecipes.length +
    compactedSessions.length +
    compactedCaffeine.length;

  const compactedEnvelope = {
    ...env,
    state: {
      ...state,
      inventory: compactedInventory,
      customRecipes: compactedRecipes,
      sessions: compactedSessions,
      caffeineLogs: compactedCaffeine,
    },
  };

  const summaryPl = `Zoptymalizowano kopię zapasową: zachowano ${compactedRecordCount} z ${originalRecordCount} rekordów, usunięto ${removedDuplicatesCount} duplikatów, oczyszczono ${cleanedFieldsCount} pól tekstowych.`;
  const summaryEn = `Compacted backup envelope: retained ${compactedRecordCount} of ${originalRecordCount} records, removed ${removedDuplicatesCount} duplicates, cleaned ${cleanedFieldsCount} text fields.`;

  return {
    compactedEnvelope,
    originalRecordCount,
    compactedRecordCount,
    removedDuplicatesCount,
    cleanedFieldsCount,
    summaryPl,
    summaryEn,
  };
}


// ============================================================================
// TASK-P98-05-ARC: Relational Integrity Auditor (Audytor spójności relacyjnej)
// ============================================================================

export interface RelationalOrphanItem {
  orphanType: 'missing_inventory_item' | 'missing_recipe';
  sessionId: string;
  referenceId: string;
  sessionRecipeName?: string;
  sessionBrewDate?: string;
  messagePl: string;
  messageEn: string;
}

export interface BackupRelationalIntegrityReport {
  isFullyConsistent: boolean;
  relationalConsistencyScore: number;
  totalSessionsAudited: number;
  linkedInventoryCount: number;
  linkedRecipeCount: number;
  orphanedInventoryReferences: number;
  orphanedRecipeReferences: number;
  orphans: RelationalOrphanItem[];
  summaryPl: string;
  summaryEn: string;
}

export function auditBackupRelationalIntegrity(candidate: unknown): BackupRelationalIntegrityReport {
  if (!candidate || typeof candidate !== 'object') {
    return {
      isFullyConsistent: true,
      relationalConsistencyScore: 100,
      totalSessionsAudited: 0,
      linkedInventoryCount: 0,
      linkedRecipeCount: 0,
      orphanedInventoryReferences: 0,
      orphanedRecipeReferences: 0,
      orphans: [],
      summaryPl: 'Brak danych do audytu relacyjnego kopii zapasowej.',
      summaryEn: 'No backup data available for relational integrity audit.',
    };
  }

  const envelope = candidate as Record<string, unknown>;
  const state = (envelope.state && typeof envelope.state === 'object' ? envelope.state : envelope) as Record<string, unknown>;

  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const customRecipes = Array.isArray(state.customRecipes) ? state.customRecipes : [];
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];

  const inventoryIds = new Set<string>();
  for (const item of inventory) {
    if (item && typeof item === 'object' && item.id != null) {
      inventoryIds.add(String(item.id).trim());
    }
  }

  const recipeIds = new Set<string>();
  for (const recipe of customRecipes) {
    if (recipe && typeof recipe === 'object' && recipe.id != null) {
      recipeIds.add(String(recipe.id).trim());
    }
  }

  const orphans: RelationalOrphanItem[] = [];
  let linkedInventoryCount = 0;
  let linkedRecipeCount = 0;
  let orphanedInventoryReferences = 0;
  let orphanedRecipeReferences = 0;

  for (const session of sessions) {
    if (!session || typeof session !== 'object') continue;

    const sId = String(session.id || 'unknown');
    const rName = session.recipeName ? String(session.recipeName) : undefined;
    const bDate = session.brewDateIso ? String(session.brewDateIso) : undefined;

    // Walidacja referencji do inwentarza (paczki ziaren)
    const rawInvId = session.inventoryItemId != null ? String(session.inventoryItemId).trim() : '';
    if (rawInvId) {
      if (inventoryIds.has(rawInvId)) {
        linkedInventoryCount++;
      } else {
        orphanedInventoryReferences++;
        orphans.push({
          orphanType: 'missing_inventory_item',
          sessionId: sId,
          referenceId: rawInvId,
          sessionRecipeName: rName,
          sessionBrewDate: bDate,
          messagePl: `Sesja ${sId} odwołuje się do nieistniejącej paczki w spiżarni (ID: ${rawInvId}).`,
          messageEn: `Session ${sId} references a missing inventory item (ID: ${rawInvId}).`,
        });
      }
    }

    // Walidacja referencji do receptury
    const rawRecipeId = session.recipeId != null ? String(session.recipeId).trim() : '';
    if (rawRecipeId) {
      const isMasterRecipe =
        rawRecipeId.startsWith('master-') ||
        rawRecipeId.startsWith('builtin-') ||
        rawRecipeId.startsWith('default-') ||
        rawRecipeId.startsWith('core-');

      if (recipeIds.has(rawRecipeId) || isMasterRecipe) {
        linkedRecipeCount++;
      } else {
        orphanedRecipeReferences++;
        orphans.push({
          orphanType: 'missing_recipe',
          sessionId: sId,
          referenceId: rawRecipeId,
          sessionRecipeName: rName,
          sessionBrewDate: bDate,
          messagePl: `Sesja ${sId} odwołuje się do brakującej receptury autorskiej (ID: ${rawRecipeId}).`,
          messageEn: `Session ${sId} references a missing custom recipe (ID: ${rawRecipeId}).`,
        });
      }
    }
  }

  const totalSessionsAudited = sessions.length;
  const totalOrphans = orphanedInventoryReferences + orphanedRecipeReferences;
  const isFullyConsistent = totalOrphans === 0;

  const penalty = totalSessionsAudited > 0 ? (totalOrphans / totalSessionsAudited) * 50 : 0;
  const relationalConsistencyScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  const summaryPl = isFullyConsistent
    ? `Pełna spójność relacyjna (${relationalConsistencyScore}/100): ${totalSessionsAudited} sesji, 0 osieroconych referencji.`
    : `Wykryto ${totalOrphans} osieroconych relacji w kopii zapasowej (${relationalConsistencyScore}/100): ${orphanedInventoryReferences} brakujących paczek, ${orphanedRecipeReferences} brakujących receptur.`;

  const summaryEn = isFullyConsistent
    ? `Full relational integrity (${relationalConsistencyScore}/100): ${totalSessionsAudited} sessions, 0 orphaned references.`
    : `Detected ${totalOrphans} orphaned references in backup (${relationalConsistencyScore}/100): ${orphanedInventoryReferences} missing inventory items, ${orphanedRecipeReferences} missing recipes.`;

  return {
    isFullyConsistent,
    relationalConsistencyScore,
    totalSessionsAudited,
    linkedInventoryCount,
    linkedRecipeCount,
    orphanedInventoryReferences,
    orphanedRecipeReferences,
    orphans,
    summaryPl,
    summaryEn,
  };
}


// ============================================================================
// TASK-P100-05-ARC: Backup Deterministic Checksum Engine (Suma kontrolna kopii)
// ============================================================================

export interface BackupChecksumResult {
  checksumHex: string;
  bytesHashed: number;
  recordCount: number;
  collectionBreakdown: {
    inventory: number;
    customRecipes: number;
    sessions: number;
    caffeineLogs: number;
  };
  summaryPl: string;
  summaryEn: string;
}

export function computeBackupChecksum(candidate: unknown): BackupChecksumResult {
  const emptyResult: BackupChecksumResult = {
    checksumHex: '00000000',
    bytesHashed: 0,
    recordCount: 0,
    collectionBreakdown: {
      inventory: 0,
      customRecipes: 0,
      sessions: 0,
      caffeineLogs: 0,
    },
    summaryPl: 'Brak danych do wyliczenia sumy kontrolnej kopii.',
    summaryEn: 'No backup data available for checksum calculation.',
  };

  if (!candidate || typeof candidate !== 'object') {
    return emptyResult;
  }

  const envelope = candidate as Record<string, unknown>;
  const state = (envelope.state && typeof envelope.state === 'object' ? envelope.state : envelope) as Record<string, unknown>;

  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const customRecipes = Array.isArray(state.customRecipes) ? state.customRecipes : [];
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  const caffeineLogs = Array.isArray(state.caffeineLogs) ? state.caffeineLogs : [];

  const recordCount = inventory.length + customRecipes.length + sessions.length + caffeineLogs.length;

  const extractCanonicalString = (items: unknown[]): string => {
    return items
      .filter((i) => i && typeof i === 'object')
      .map((item) => {
        const obj = item as Record<string, unknown>;
        const keys = Object.keys(obj).sort();
        return keys.map((k) => `${k}:${String(obj[k])}`).join('|');
      })
      .sort()
      .join(';');
  };

  const canonicalPayload = [
    `inv:${extractCanonicalString(inventory)}`,
    `rec:${extractCanonicalString(customRecipes)}`,
    `ses:${extractCanonicalString(sessions)}`,
    `caf:${extractCanonicalString(caffeineLogs)}`,
  ].join('##');

  let hash = 2166136261;
  for (let i = 0; i < canonicalPayload.length; i++) {
    hash ^= canonicalPayload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const checksumHex = (hash >>> 0).toString(16).padStart(8, '0');
  const bytesHashed = canonicalPayload.length;

  const summaryPl = `Suma kontrolna kopii: 0x${checksumHex.toUpperCase()} (${recordCount} rekordów, ${bytesHashed} bajtów).`;
  const summaryEn = `Backup checksum: 0x${checksumHex.toUpperCase()} (${recordCount} records, ${bytesHashed} bytes).`;

  return {
    checksumHex,
    bytesHashed,
    recordCount,
    collectionBreakdown: {
      inventory: inventory.length,
      customRecipes: customRecipes.length,
      sessions: sessions.length,
      caffeineLogs: caffeineLogs.length,
    },
    summaryPl,
    summaryEn,
  };
}

export interface BackupDuplicateItem {
  collection: 'inventory' | 'customRecipes' | 'sessions' | 'caffeineLogs';
  id: string;
  duplicateField: string;
  duplicateValue: string;
  occurrenceCount: number;
}

export interface BackupDuplicateReport {
  hasDuplicates: boolean;
  totalDuplicateCount: number;
  duplicateInventoryCount: number;
  duplicateRecipesCount: number;
  duplicateSessionsCount: number;
  duplicateCaffeineCount: number;
  duplicates: BackupDuplicateItem[];
  summaryPl: string;
  summaryEn: string;
}

export function detectBackupDuplicates(candidate: unknown): BackupDuplicateReport {
  const emptyReport: BackupDuplicateReport = {
    hasDuplicates: false,
    totalDuplicateCount: 0,
    duplicateInventoryCount: 0,
    duplicateRecipesCount: 0,
    duplicateSessionsCount: 0,
    duplicateCaffeineCount: 0,
    duplicates: [],
    summaryPl: 'Brak zduplikowanych rekordów w kopii zapasowej.',
    summaryEn: 'No duplicate records detected in backup envelope.',
  };

  if (!candidate || typeof candidate !== 'object') {
    return emptyReport;
  }

  const root = candidate as Record<string, unknown>;
  const payload = (root.state && typeof root.state === 'object'
    ? root.state
    : root.payload && typeof root.payload === 'object'
    ? root.payload
    : root) as Record<string, unknown>;

  const inventory = Array.isArray(payload.inventory) ? payload.inventory : [];
  const customRecipes = Array.isArray(payload.customRecipes) ? payload.customRecipes : [];
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const caffeineLogs = Array.isArray(payload.caffeineLogs) ? payload.caffeineLogs : [];

  const duplicates: BackupDuplicateItem[] = [];

  const checkDuplicates = (
    items: unknown[],
    collection: 'inventory' | 'customRecipes' | 'sessions' | 'caffeineLogs',
    contentKeyExtractor?: (item: Record<string, unknown>) => string | null
  ) => {
    const idCounts = new Map<string, number>();
    const contentCounts = new Map<string, { count: number; firstId: string }>();

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : '';

      if (id) {
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      }

      if (contentKeyExtractor) {
        const contentKey = contentKeyExtractor(rec);
        if (contentKey) {
          const prev = contentCounts.get(contentKey);
          if (prev) {
            prev.count += 1;
          } else {
            contentCounts.set(contentKey, { count: 1, firstId: id });
          }
        }
      }
    }

    const reportedIds = new Set<string>();

    for (const [id, count] of idCounts.entries()) {
      if (count > 1) {
        duplicates.push({
          collection,
          id,
          duplicateField: 'id',
          duplicateValue: id,
          occurrenceCount: count,
        });
        reportedIds.add(id);
      }
    }

    if (contentKeyExtractor) {
      for (const [key, { count, firstId }] of contentCounts.entries()) {
        if (count > 1 && !reportedIds.has(firstId)) {
          duplicates.push({
            collection,
            id: firstId,
            duplicateField: 'content_signature',
            duplicateValue: key,
            occurrenceCount: count,
          });
        }
      }
    }
  };

  checkDuplicates(inventory, 'inventory', (rec) => {
    const name = typeof rec.name === 'string' ? rec.name.trim().toLowerCase() : '';
    const brand = typeof rec.brand === 'string' ? rec.brand.trim().toLowerCase() : '';
    return name ? `${brand}::${name}` : null;
  });

  checkDuplicates(customRecipes, 'customRecipes', (rec) => {
    const name = typeof rec.name === 'string' ? rec.name.trim().toLowerCase() : '';
    const method = typeof rec.method === 'string' ? rec.method.trim().toLowerCase() : '';
    return name ? `${method}::${name}` : null;
  });

  checkDuplicates(sessions, 'sessions', (rec) => {
    const createdAt = typeof rec.createdAt === 'string' ? rec.createdAt.trim() : '';
    const recipeId = typeof rec.recipeId === 'string' ? rec.recipeId.trim() : '';
    const dose = typeof rec.doseGrams === 'number' ? rec.doseGrams : '';
    return createdAt ? `${createdAt}::${recipeId}::${dose}` : null;
  });

  checkDuplicates(caffeineLogs, 'caffeineLogs');

  const duplicateInventoryCount = duplicates.filter((d) => d.collection === 'inventory').length;
  const duplicateRecipesCount = duplicates.filter((d) => d.collection === 'customRecipes').length;
  const duplicateSessionsCount = duplicates.filter((d) => d.collection === 'sessions').length;
  const duplicateCaffeineCount = duplicates.filter((d) => d.collection === 'caffeineLogs').length;
  const totalDuplicateCount = duplicates.length;
  const hasDuplicates = totalDuplicateCount > 0;

  const summaryPl = hasDuplicates
    ? `Wykryto ${totalDuplicateCount} duplikatów w kopii zapasowej (inwentarz: ${duplicateInventoryCount}, receptury: ${duplicateRecipesCount}, sesje: ${duplicateSessionsCount}, kofeina: ${duplicateCaffeineCount}).`
    : 'Brak zduplikowanych rekordów w kopii zapasowej.';
  const summaryEn = hasDuplicates
    ? `Detected ${totalDuplicateCount} duplicates in backup envelope (inventory: ${duplicateInventoryCount}, recipes: ${duplicateRecipesCount}, sessions: ${duplicateSessionsCount}, caffeine: ${duplicateCaffeineCount}).`
    : 'No duplicate records detected in backup envelope.';

  return {
    hasDuplicates,
    totalDuplicateCount,
    duplicateInventoryCount,
    duplicateRecipesCount,
    duplicateSessionsCount,
    duplicateCaffeineCount,
    duplicates,
    summaryPl,
    summaryEn,
  };
}

export type BackupRestoreConflictType = 'none' | 'schema_mismatch' | 'id_collision' | 'empty_payload';

export interface BackupRestoreSimulationResult {
  canRestoreSafely: boolean;
  conflictType: BackupRestoreConflictType;
  itemsToInsert: number;
  itemsToUpdate: number;
  totalIncomingRecords: number;
  recordsBreakdown: {
    inventory: number;
    recipes: number;
    sessions: number;
    caffeineLogs: number;
  };
  recommendationPl: string;
  recommendationEn: string;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Symuluje proces przywracania kopii zapasowej w trybie podglądu (dry-run).
 * Szacuje liczbę nowych i aktualizowanych wpisów oraz wykrywa potencjalne kolizje przed wykonaniem transakcji.
 */
export function simulateBackupRestore(
  backupEnvelope?: unknown,
  currentRecordCounts?: {
    inventory?: number;
    recipes?: number;
    sessions?: number;
    caffeineLogs?: number;
  } | null
): BackupRestoreSimulationResult {
  if (!backupEnvelope || typeof backupEnvelope !== 'object') {
    return {
      canRestoreSafely: false,
      conflictType: 'empty_payload',
      itemsToInsert: 0,
      itemsToUpdate: 0,
      totalIncomingRecords: 0,
      recordsBreakdown: {
        inventory: 0,
        recipes: 0,
        sessions: 0,
        caffeineLogs: 0,
      },
      recommendationPl: 'Uszkodzony lub pusty plik kopii zapasowej — operacja anulowana.',
      recommendationEn: 'Corrupted or empty backup envelope — restore aborted.',
      summaryPl: 'Symulacja przywracania: błąd (pusty ładunek kopii).',
      summaryEn: 'Restore simulation: error (empty backup payload).',
    };
  }

  const env = backupEnvelope as any;
  const version = typeof env.version === 'number' ? env.version : typeof env.schemaVersion === 'number' ? env.schemaVersion : 1;

  if (version > 5) {
    return {
      canRestoreSafely: false,
      conflictType: 'schema_mismatch',
      itemsToInsert: 0,
      itemsToUpdate: 0,
      totalIncomingRecords: 0,
      recordsBreakdown: {
        inventory: 0,
        recipes: 0,
        sessions: 0,
        caffeineLogs: 0,
      },
      recommendationPl: `Nieobsługiwany schemat kopii v${version}. Zaktualizuj aplikację Napar do najnowszej wersji.`,
      recommendationEn: `Unsupported schema v${version}. Please update Napar app to the latest version.`,
      summaryPl: `Symulacja przywracania: niezgodność wersji schematu (v${version}).`,
      summaryEn: `Restore simulation: schema mismatch (v${version}).`,
    };
  }

  const data = env.data || env.state || env;
  const getCount = (arr: unknown) => (Array.isArray(arr) ? arr.length : 0);

  const inventoryCount = getCount(data.inventory || data.beans);
  const recipesCount = getCount(data.customRecipes || data.recipes);
  const sessionsCount = getCount(data.sessions || data.brewSessions || data.brewLogs);
  const caffeineCount = getCount(data.caffeineLogs || data.caffeine);

  const totalIncomingRecords = inventoryCount + recipesCount + sessionsCount + caffeineCount;

  if (totalIncomingRecords === 0) {
    return {
      canRestoreSafely: false,
      conflictType: 'empty_payload',
      itemsToInsert: 0,
      itemsToUpdate: 0,
      totalIncomingRecords: 0,
      recordsBreakdown: {
        inventory: 0,
        recipes: 0,
        sessions: 0,
        caffeineLogs: 0,
      },
      recommendationPl: 'Kopia zapasowa nie zawiera żadnych rekordów danych.',
      recommendationEn: 'Backup envelope contains zero data records.',
      summaryPl: 'Symulacja przywracania: brak rekordów w pliku.',
      summaryEn: 'Restore simulation: no records found in file.',
    };
  }

  const existingTotal =
    (currentRecordCounts?.inventory || 0) +
    (currentRecordCounts?.recipes || 0) +
    (currentRecordCounts?.sessions || 0) +
    (currentRecordCounts?.caffeineLogs || 0);

  let itemsToUpdate = 0;
  let itemsToInsert = totalIncomingRecords;
  let conflictType: BackupRestoreConflictType = 'none';

  if (existingTotal > 0) {
    itemsToUpdate = Math.min(totalIncomingRecords, existingTotal);
    itemsToInsert = Math.max(0, totalIncomingRecords - itemsToUpdate);
    conflictType = itemsToUpdate > 0 ? 'id_collision' : 'none';
  }

  const canRestoreSafely = true;

  let recommendationPl = '';
  let recommendationEn = '';

  if (conflictType === 'id_collision') {
    recommendationPl = `Wykryto ${itemsToUpdate} potencjalnie nakładających się rekordów. Rekordy zostaną zaktualizowane w trybie łączenia (merge).`;
    recommendationEn = `Detected ${itemsToUpdate} potentially overlapping records. Records will be merged and updated.`;
  } else {
    recommendationPl = `Wszystkie ${totalIncomingRecords} rekordów zostanie zaimportowanych jako nowe wpisy.`;
    recommendationEn = `All ${totalIncomingRecords} records will be imported as new items.`;
  }

  const summaryPl = `Symulacja przywracania: ${itemsToInsert} do wstawienia, ${itemsToUpdate} do aktualizacji (łącznie ${totalIncomingRecords} rekordów). ${recommendationPl}`;
  const summaryEn = `Restore simulation: ${itemsToInsert} to insert, ${itemsToUpdate} to update (${totalIncomingRecords} total records). ${recommendationEn}`;

  return {
    canRestoreSafely,
    conflictType,
    itemsToInsert,
    itemsToUpdate,
    totalIncomingRecords,
    recordsBreakdown: {
      inventory: inventoryCount,
      recipes: recipesCount,
      sessions: sessionsCount,
      caffeineLogs: caffeineCount,
    },
    recommendationPl,
    recommendationEn,
    summaryPl,
    summaryEn,
  };
}

