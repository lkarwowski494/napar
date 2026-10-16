// ============================================================================
// Napar (Steepwise) — Backup Engine (Zadanie N5 / Apps4Brew SEC-09)
// Rotating 10 auto-backups in Documents/Backup/, safety backups before destructive
// operations, and standardized BackupEnvelope<T> format.
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog } from './database-schema';

export const SCHEMA_VERSION = 1;
export const AUTO_DIR = 'Backup/';
export const AUTO_KEEP = 10;

/**
 * Wzorzec nazw kopii automatycznych: napar-RRRR-MM-DD-GGMMSS[-N].json
 */
export const AUTO_RE = /^napar-(\d{4}-\d{2}-\d{2}-\d{6})(?:-(\d{1,3}))?\.json$/;

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

const poolKey = (m: RegExpExecArray) => `${m[1]}-${(m[2] ?? '1').padStart(3, '0')}`;

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
      // Ignoruj błąd
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

  try {
    await FileSystem.writeAsStringAsync(targetPath, JSON.stringify(envelope, null, 2));
  } catch (e) {
    try {
      await FileSystem.deleteAsync(targetPath, { idempotent: true });
    } catch {
      // Ignoruj błąd
    }
    throw e;
  }

  // Rotacja puli
  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    const pool = files
      .map((f) => [f, re.exec(f)] as const)
      .filter((x): x is readonly [string, RegExpExecArray] => !!x[1]);

    const oldFiles = pool
      .map(([f, m]) => [f, poolKey(m)] as const)
      .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0))
      .slice(AUTO_KEEP);

    for (const [f] of oldFiles) {
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
 * Kopia bezpieczeństwa przed operacjami niszczącymi (import, reset bazy).
 */
export async function safetyBackup(
  kind: 'import' | 'reset',
  state: NaparBackupData
): Promise<string> {
  const prefix = kind === 'import' ? 'napar-przed-importem-' : 'napar-przed-czyszczeniem-';
  return await writeBackupFile(prefix, SAFETY_RE, state);
}

/**
 * Waliduje poprawność schematu pliku kopii zapasowej.
 */
export function parseAndValidateBackup(rawJson: string): NaparBackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Nieprawidłowy format JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Plik kopii musi być obiektem JSON');
  }

  const envelope = parsed as Partial<NaparBackupEnvelope>;

  if (envelope.format !== 'napar-backup') {
    throw new Error('Nieznany format pliku (oczekiwano "napar-backup")');
  }

  if (typeof envelope.schemaVersion !== 'number' || envelope.schemaVersion <= 0) {
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

  return envelope as NaparBackupEnvelope;
}
