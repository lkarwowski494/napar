// ============================================================================
// Apps4Brew Database Path Protection (SEC-09)
// Redirects SQLite working database away from public Documents/SQLite directory
// to private /Library/SQLite (backed up to iCloud/iTunes, inaccessible in Files app).
// ============================================================================

export function dbDirectory(def?: string | null): string | undefined {
  return def && /\/Documents\/SQLite\/?$/.test(def)
    ? def.replace(/\/Documents\/SQLite\/?$/, '/Library/SQLite')
    : undefined;
}
