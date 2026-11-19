// ============================================================================
// Napar — tożsamość aplikacji w App Store (M1-audytor-generalny-022; 10-wydanie-003)
// Prawdziwe Apple ID aplikacji wpisuje właściciel po utworzeniu rekordu w App Store Connect.
// Do tego czasu null: link „Oceń w App Store” jest ukryty (zamiast prowadzić do nieistniejącej aplikacji).
// ============================================================================

export const APP_STORE_ID: string | null = null;

export function appStoreReviewUrl(id: string): string {
  return `https://apps.apple.com/app/id${encodeURIComponent(id)}?action=write-review`;
}

// ============================================================================
// Strona produktu i kontakt (M1-audytor-generalny-023; 10-wydanie-001, DEC-07 a)
// Strona: GitHub Pages z katalogu site/ (włączenie Pages w ustawieniach repo to krok właściciela).
// ============================================================================

// Strony sprawdzane przez .github/workflows/site-check.yml (po jednej w linii, względem SITE_BASE_URL):
// site-check: privacy.html
// site-check: en/privacy.html
// site-check: terms.html
// site-check: support.html
export const SITE_BASE_URL = 'https://lkarwowski494.github.io/napar/';
export const TERMS_URL = `${SITE_BASE_URL}terms.html`;
export const SUPPORT_URL = `${SITE_BASE_URL}support.html`;

/** Polityka prywatności w języku interfejsu: PL w katalogu głównym, EN w en/ (10-wydanie-010). */
export function privacyPolicyUrl(lang: 'pl' | 'en'): string {
  return lang === 'en' ? `${SITE_BASE_URL}en/privacy.html` : `${SITE_BASE_URL}privacy.html`;
}

// DEC-07 a (KO-002, D-017): działający adres e-mail kontaktu, wpisany tu, w site/support.html,
// w docs/15-app-store.md oraz w docs/wydanie/app-review-notes.md.
export const SUPPORT_EMAIL: string | null = 'support@apps4brew.com';

export function supportMailtoUrl(email: string): string {
  return `mailto:${email}`;
}
