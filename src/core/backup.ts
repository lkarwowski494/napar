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
  return {
    format: 'napar-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
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

  if (typeof envelope.exportedAt !== 'string' || !envelope.exportedAt.trim()) {
    throw new Error('Nieprawidłowy lub brakujący znacznik czasu eksportu (exportedAt)');
  }

  return envelope as NaparBackupEnvelope;
}
