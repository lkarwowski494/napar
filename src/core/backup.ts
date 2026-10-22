// ============================================================================
// Napar (Steepwise) — Kopia zapasowa (BR-TEST-022, BR-TEST-023, RD-ENG-12)
// Format v2: { format: 'napar-backup', version: 2, exportedAt, state }.
// Import akceptuje v2 oraz v1 (dwa dawne warianty), odrzuca nieznane.
// Pełny eksport bez limitów. Import jest atomowy (jedna transakcja).
// Operacje na plikach idą przez port BackupStorage (implementacja w src/platform).
// ============================================================================

import type { DbPort } from './db-port';
import type { BrewSession, CaffeineLog, InventoryItem, SavedRecipe } from './database-schema';
import { listCaffeineLogs, logCaffeine } from './repositories/caffeine';
import { getInventoryItems, restoreInventoryItem } from './repositories/inventory';
import { listCustomRecipes, saveRecipe } from './repositories/recipes';
import { listBrewSessions, saveBrewSession } from './repositories/brew-sessions';
import {
  listPortableAppSettings,
  NON_PORTABLE_SETTING_KEYS,
  upsertAppSetting,
} from './repositories/app-settings';
import { errorReason } from './db-location';

export const BACKUP_FORMAT = 'napar-backup';
export const BACKUP_VERSION = 2;
export const LEGACY_BACKUP_VERSION = 1;
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

/** Zawartość kopii (stan po odczycie z bazy lub po walidacji pliku). */
export interface NaparBackupData {
  inventory: InventoryItem[];
  customRecipes: SavedRecipe[];
  sessions: BrewSession[];
  caffeineLogs: CaffeineLog[];
  settings: Record<string, string>;
}

export interface NaparBackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  state: NaparBackupData;
}

export interface CorruptStateRecovery {
  corruptFile: string;
  timestamp: string;
  rawSnippet: string;
}

// ----------------------------------------------------------------------------
// Odczyt stanu z bazy i zapis (bez limitów)
// ----------------------------------------------------------------------------

/** Pełny stan do kopii: wszystkie wiersze, bez LIMIT. */
export function collectBackupState(db: DbPort): NaparBackupData {
  const settings: Record<string, string> = {};
  for (const row of listPortableAppSettings(db)) {
    settings[row.key] = row.value;
  }
  return {
    inventory: getInventoryItems(db, true),
    customRecipes: listCustomRecipes(db),
    sessions: listBrewSessions(db),
    caffeineLogs: listCaffeineLogs(db),
    settings,
  };
}

/**
 * Import atomowy: wszystkie wiersze z pliku w jednej transakcji.
 * Rekordy spoza pliku nie są ruszane. Klucze niepenetrowalne są pomijane.
 */
export function importBackupState(db: DbPort, state: NaparBackupData): void {
  try {
    db.withTransactionSync(() => {
      for (const item of state.inventory) {
        restoreInventoryItem(db, item);
      }
      for (const recipe of state.customRecipes) {
        saveRecipe(db, { ...recipe, isCustom: true });
      }
      for (const session of state.sessions) {
        saveBrewSession(db, session);
      }
      for (const log of state.caffeineLogs) {
        logCaffeine(db, log);
      }
      for (const [key, value] of Object.entries(state.settings)) {
        if (!NON_PORTABLE_SETTING_KEYS.includes(key)) {
          upsertAppSetting(db, key, value);
        }
      }
    });
  } catch (error) {
    throw new Error(
      `Import nie powiódł się, dane nie zostały zmienione (${errorReason(error)})`
    );
  }
}

// ----------------------------------------------------------------------------
// Format: budowa, walidacja, normalizacja wersji
// ----------------------------------------------------------------------------

export function buildBackup(state: NaparBackupData, now: Date = new Date()): NaparBackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    state,
  };
}

type Json = Record<string, unknown>;

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecords<T>(value: unknown, message: string): T[] {
  if (!Array.isArray(value)) fail(message);
  for (const record of value) {
    if (!isRecord(record) || typeof record.id !== 'string' || record.id === '') {
      fail(`${message} (każdy wpis musi mieć identyfikator)`);
    }
  }
  return value as T[];
}

function readSettings(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!isRecord(value)) fail('Nieprawidłowa sekcja ustawień ("settings" musi być obiektem)');
  const settings: Record<string, string> = {};
  for (const [key, setting] of Object.entries(value)) {
    if (typeof setting !== 'string') fail('Nieprawidłowa wartość ustawienia (oczekiwano tekstu)');
    settings[key] = setting;
  }
  return settings;
}

function readState(source: Json): NaparBackupData {
  return {
    inventory: requireRecords<InventoryItem>(
      source.inventory,
      'Nieprawidłowa struktura spiżarni ("inventory" musi być tablicą)'
    ),
    customRecipes: requireRecords<SavedRecipe>(
      source.customRecipes,
      'Nieprawidłowa struktura przepisów ("customRecipes" musi być tablicą)'
    ),
    sessions: requireRecords<BrewSession>(
      source.sessions,
      'Nieprawidłowa struktura sesji ("sessions" musi być tablicą)'
    ),
    caffeineLogs:
      source.caffeineLogs === undefined
        ? []
        : requireRecords<CaffeineLog>(
            source.caffeineLogs,
            'Nieprawidłowa struktura kofeiny ("caffeineLogs" musi być tablicą)'
          ),
    settings: readSettings(source.settings),
  };
}

function exportedAtOf(source: Json): string {
  return typeof source.exportedAt === 'string' ? source.exportedAt : '';
}

/**
 * Waliduje plik kopii i zwraca envelope w wersji 2 (v1 jest przeliczane w pamięci).
 * Odrzuca nieznany format, nieznane lub nowsze wersje oraz niepoprawną strukturę.
 */
export function parseAndValidateBackup(rawJson: string): NaparBackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Nieprawidłowy format JSON');
  }

  if (!isRecord(parsed)) {
    throw new Error('Plik kopii musi być obiektem JSON');
  }

  // v1 w wariancie pliku z zapisu automatycznego: { format, schemaVersion: 1, state }
  if (parsed.format === BACKUP_FORMAT && parsed.schemaVersion === LEGACY_BACKUP_VERSION) {
    if (!isRecord(parsed.state)) {
      fail('Brak danych stanu (sekcja "state") w pliku kopii');
    }
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: exportedAtOf(parsed),
      state: readState(parsed.state),
    };
  }

  // v1 w wariancie eksportu JSON: { version: 1, exportedAt, inventory, ... } bez pola format
  if (parsed.format === undefined && parsed.version === LEGACY_BACKUP_VERSION) {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: exportedAtOf(parsed),
      state: readState(parsed),
    };
  }

  if (parsed.format === BACKUP_FORMAT) {
    if (parsed.version === BACKUP_VERSION) {
      if (!isRecord(parsed.state)) {
        fail('Brak danych stanu (sekcja "state") w pliku kopii');
      }
      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: exportedAtOf(parsed),
        state: readState(parsed.state),
      };
    }
    const newer = typeof parsed.version === 'number' && parsed.version > BACKUP_VERSION;
    if (newer) {
      fail(
        `Kopia pochodzi z nowszej wersji aplikacji (v${String(parsed.version)}). Zaktualizuj aplikację.`
      );
    }
    fail(`Nieobsługiwana wersja kopii zapasowej (${String(parsed.version ?? parsed.schemaVersion)})`);
  }

  fail('Nieznany format pliku (oczekiwano "napar-backup")');
}

// ----------------------------------------------------------------------------
// Nazwy plików i rotacja
// ----------------------------------------------------------------------------

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
  const pool = fileList
    .map((f) => [f, poolRegex.exec(f)] as const)
    .filter((x): x is readonly [string, RegExpExecArray] => !!x[1]);

  if (pool.length <= keepCount) {
    return [];
  }

  // Sortuj malejąco po dacie/czasie + przyrostku kolizji
  const sorted = pool.sort((a, b) => {
    const keyA = poolKey(a[1]);
    const keyB = poolKey(b[1]);
    return keyA < keyB ? 1 : keyA > keyB ? -1 : 0;
  });

  return sorted.slice(keepCount).map(([f]) => f);
}

// ----------------------------------------------------------------------------
// Port magazynu plików (implementacja: src/platform/backup-storage.ts)
// ----------------------------------------------------------------------------

export interface ShareOptions {
  mimeType: string;
  dialogTitle: string;
}

export interface BackupStorage {
  documentDirectory: string | null;
  cacheDirectory: string | null;
  exists(path: string): Promise<boolean>;
  makeDirectory(path: string): Promise<void>;
  writeText(path: string, text: string): Promise<void>;
  readText(path: string): Promise<string>;
  listDirectory(path: string): Promise<string[]>;
  /** Usuwa plik; brak pliku nie jest błędem. */
  remove(path: string): Promise<void>;
  /** Zwraca false, gdy udostępnianie nie jest dostępne na urządzeniu. */
  share(path: string, options: ShareOptions): Promise<boolean>;
}

let storage: BackupStorage | null = null;

export function configureBackupStorage(next: BackupStorage | null): void {
  storage = next;
}

function requireStorage(): BackupStorage {
  if (!storage) {
    throw new Error('Brak magazynu kopii zapasowych');
  }
  return storage;
}

function requireDocumentDirectory(s: BackupStorage): string {
  if (!s.documentDirectory) {
    throw new Error('Brak katalogu dokumentów aplikacji');
  }
  return s.documentDirectory;
}

/**
 * Udostępnienie pliku tymczasowego w Caches z gwarantowanym usunięciem w bloku finally.
 */
async function shareTemp(name: string, body: string, options: ShareOptions): Promise<boolean> {
  const s = requireStorage();
  const baseDir = s.cacheDirectory || s.documentDirectory || '';
  const path = `${baseDir}${name}`;
  try {
    await s.writeText(path, body);
    return await s.share(path, options);
  } finally {
    try {
      await s.remove(path);
    } catch {
      // Ignoruj błąd usuwania pliku tymczasowego
    }
  }
}

/**
 * Eksport kopii zapasowej do pliku JSON (arkusz udostępniania).
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
async function writeBackupFile(prefix: string, re: RegExp, state: NaparBackupData): Promise<string> {
  const s = requireStorage();
  const dir = `${requireDocumentDirectory(s)}${AUTO_DIR}`;
  if (!(await s.exists(dir))) {
    await s.makeDirectory(dir);
  }

  const stamp = stampOf(new Date());
  let name = `${prefix}${stamp}.json`;

  for (let n = 2; n < 1000 && (await s.exists(`${dir}${name}`)); n++) {
    name = `${prefix}${stamp}-${n}.json`;
  }

  const envelope = buildBackup(state);
  const targetPath = `${dir}${name}`;

  try {
    await s.writeText(targetPath, JSON.stringify(envelope, null, 2));
  } catch (e) {
    try {
      await s.remove(targetPath);
    } catch {
      // Ignoruj błąd
    }
    throw e;
  }

  // Rotacja rozdzielnej puli (RD-ENG-12)
  try {
    const files = await s.listDirectory(dir);
    for (const f of rotateBackupFiles(files, re, AUTO_KEEP)) {
      await s.remove(`${dir}${f}`);
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
export async function safetyBackup(kind: 'import' | 'reset', state: NaparBackupData): Promise<string> {
  const prefix = kind === 'import' ? 'napar-przed-importem-' : 'napar-przed-czyszczeniem-';
  return await writeBackupFile(prefix, SAFETY_RE, state);
}

/**
 * BR-TEST-023: Zapis uszkodzonego stanu do pliku ratunkowego state_corrupt_<timestamp>.json
 */
export async function saveCorruptState(rawPayload: string, reason: string): Promise<string> {
  const s = requireStorage();
  const dir = `${requireDocumentDirectory(s)}${AUTO_DIR}`;
  if (!(await s.exists(dir))) {
    await s.makeDirectory(dir);
  }

  const stamp = stampOf(new Date());
  const filePath = `${dir}state_corrupt_${stamp}.json`;
  const envelope = {
    format: 'napar-corrupt-state',
    timestamp: new Date().toISOString(),
    reason,
    recovery: {
      rawPayload,
    },
  };
  await s.writeText(filePath, JSON.stringify(envelope, null, 2));
  return filePath;
}

/**
 * BR-TEST-023: Sprawdzenie czy istnieje zapisany uszkodzony stan po awarii
 */
export async function checkCorruptState(): Promise<CorruptStateRecovery | null> {
  try {
    const s = requireStorage();
    const docDir = s.documentDirectory;
    if (!docDir) return null;
    const dir = `${docDir}${AUTO_DIR}`;
    if (!(await s.exists(dir))) return null;
    const files = await s.listDirectory(dir);
    const corruptFiles = files.filter((f) => f.startsWith('state_corrupt_')).sort().reverse();
    if (corruptFiles.length === 0) return null;

    const latest = corruptFiles[0];
    const parsed = JSON.parse(await s.readText(`${dir}${latest}`));
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
    const s = requireStorage();
    if (!s.documentDirectory) return;
    await s.remove(`${s.documentDirectory}${AUTO_DIR}${fileName}`);
  } catch {
    // Ignoruj błąd
  }
}
