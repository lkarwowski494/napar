// ============================================================================
// Napar — tożsamość aplikacji w App Store (M1-audytor-generalny-022; 10-wydanie-003)
// Prawdziwe Apple ID aplikacji wpisuje właściciel po utworzeniu rekordu w App Store Connect.
// Do tego czasu null: link „Oceń w App Store” jest ukryty (zamiast prowadzić do nieistniejącej aplikacji).
// ============================================================================

export const APP_STORE_ID: string | null = null;

export function appStoreReviewUrl(id: string): string {
  return `https://apps.apple.com/app/id${encodeURIComponent(id)}?action=write-review`;
}
