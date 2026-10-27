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

  const pState = primary.state && typeof primary.state === 'object' ? primary.state : ({} as any);
  const iState = incoming.state && typeof incoming.state === 'object' ? incoming.state : ({} as any);

  const mergedInventory = mergeCollection(pState.inventory, iState.inventory);
  const mergedRecipes = mergeCollection(pState.customRecipes, iState.customRecipes);
  const mergedSessions = mergeCollection(pState.sessions, iState.sessions);
  const mergedCaffeine = mergeCollection(pState.caffeineLogs, iState.caffeineLogs);

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
