// ============================================================================
// Napar (Steepwise) — Nazwy języków interfejsu w ich własnym języku (picker w Ustawieniach)
// Standardowe nazwy własne (bez tłumaczenia maszynowego). Klucze: kody z LANGS.
// ============================================================================

import type { LangCode } from './i18n-loader';

export const LANGUAGE_NATIVE_NAMES: Record<LangCode, string> = {
  ar: 'العربية',
  bg: 'Български',
  ca: 'Català',
  cs: 'Čeština',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  en: 'English',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  he: 'עברית',
  hi: 'हिन्दी',
  hr: 'Hrvatski',
  hu: 'Magyar',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  ms: 'Bahasa Melayu',
  nl: 'Nederlands',
  no: 'Norsk',
  pl: 'Polski',
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português (Portugal)',
  ro: 'Română',
  ru: 'Русский',
  sk: 'Slovenčina',
  sv: 'Svenska',
  th: 'ไทย',
  tr: 'Türkçe',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  'zh-Hans': '中文（简体）',
  'zh-Hant': '中文（繁體）',
};

/** Nazwa języka w nim samym; dla kodu spoza listy zwraca sam kod. */
export function nativeLanguageName(code: LangCode): string {
  return LANGUAGE_NATIVE_NAMES[code] ?? code;
}
