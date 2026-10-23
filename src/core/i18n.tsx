// ============================================================================
// Napar (Steepwise) — System Internacjonalizacji (i18n), warstwa React
// Słowniki: locales/*.json (źródło kluczy: locales/pl.json). Wybór języka i fallback:
// src/core/i18n-loader.ts. Język systemu: adapter w src/platform/system-locale.ts.
// 100% offline, zero telemetrii.
// ============================================================================

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readSystemLocale } from '../platform/system-locale';
import { getLanguageSetting, setLanguageSetting } from './database';
import {
  buildMessages,
  LANGS,
  LangCode,
  LanguageSetting,
  parseLanguageSetting,
  resolveLanguage,
  SYSTEM_LANGUAGE,
  Translations,
} from './i18n-loader';

export { LANGS, SYSTEM_LANGUAGE };
export type { LangCode, LanguageSetting, Translations } from './i18n-loader';
export type SupportedLanguage = LangCode;

export function detectSystemLanguage(): SupportedLanguage {
  return resolveLanguage(null, readSystemLocale());
}

/** Język używany w UI: wybór użytkownika zapisany w app_settings, a gdy go brak — język systemu. */
export function getCurrentLanguage(): SupportedLanguage {
  return resolveLanguage(getLanguageSetting(), readSystemLocale());
}

const warnMissingKey = (path: string, lang: LangCode) => {
  if (__DEV__) {
    console.warn(`[i18n] Brak klucza "${path}" w języku "${lang}", użyto zapasowego tekstu.`);
  }
};

const builtMessages: Partial<Record<LangCode, Translations>> = {};

/** Kompletny słownik języka (liczony raz na język). */
export function getTranslations(lang: LangCode): Translations {
  const cached = builtMessages[lang];
  if (cached) return cached;
  const built = buildMessages(lang, warnMissingKey);
  builtMessages[lang] = built;
  return built;
}

export const translations: { pl: Translations; en: Translations } = {
  pl: getTranslations('pl'),
  en: getTranslations('en'),
};

interface LanguageContextType {
  /** Język faktycznie używany (po rozwiązaniu wyboru i języka systemu). */
  language: SupportedLanguage;
  /** Wybór użytkownika: kod języka albo „system”. */
  setting: LanguageSetting;
  /** Zapisuje wybór w app_settings i od razu przelicza słownik. */
  setLanguage: (setting: LanguageSetting) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pl',
  setting: SYSTEM_LANGUAGE,
  setLanguage: () => {},
  t: translations.pl,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setting, setSetting] = useState<LanguageSetting>(() => getLanguageSetting());
  const [systemLocale] = useState<string | null>(() => readSystemLocale());

  const language = resolveLanguage(setting, systemLocale);

  const setLanguage = useCallback((next: LanguageSetting) => {
    const value = parseLanguageSetting(next);
    setLanguageSetting(value);
    setSetting(value);
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({ language, setting, setLanguage, t: getTranslations(language) }),
    [language, setting, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation(): LanguageContextType {
  return useContext(LanguageContext);
}

export function getCurrentTranslations(): Translations {
  return getTranslations(getCurrentLanguage());
}

/**
 * Polska odmiana gramatyczna liczebników (RD-ENG-09, NFR-I18N-007).
 * Dla n = |x| mod 100, n10 = n mod 10:
 * - jeśli |x| === 1 -> one (np. 1 seria, 1 sekunda, 1 klik)
 * - jeśli n10 in {2, 3, 4} i n not in {12, 13, 14} -> few (np. 2 serie, 22 serie, 104 serie)
 * - inaczej -> many (np. 0 serii, 5 serii, 12 serii, 21 serii, 112 serii)
 */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.floor(count));
  const n = abs % 100;
  const n10 = n % 10;
  if (abs === 1) return one;
  if (n10 >= 2 && n10 <= 4 && (n < 12 || n > 14)) return few;
  return many;
}

/**
 * Uniwersalny helper pluralizacji dla języków aplikacji ('pl' | 'en')
 */
export function plural(
  lang: SupportedLanguage,
  count: number,
  forms: { one: string; few?: string; many?: string; other?: string }
): string {
  if (lang === 'pl') {
    return pluralPl(count, forms.one, forms.few ?? forms.one, forms.many ?? forms.few ?? forms.one);
  }
  const abs = Math.abs(Math.floor(count));
  if (abs === 1) return forms.one;
  return forms.other ?? forms.many ?? forms.few ?? forms.one;
}
