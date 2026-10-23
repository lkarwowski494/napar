// ============================================================================
// Napar (Steepwise) — Loader słowników i wybór języka (czysty TS, bez expo)
// Źródło prawdy kluczy: locales/pl.json (typ `Translations`). Pozostałe 34 pliki
// w locales/ muszą mieć te same klucze i parametry (scripts/check-i18n.mjs).
// Kolejność wyboru: ustawienie użytkownika -> język systemu -> en.
// Brakujący klucz w języku docelowym: en -> sam klucz (ostrzeżenie w dev).
// Język systemu przychodzi jako argument z adaptera platformy (src/platform).
// ============================================================================

import plMessages from '../../locales/pl.json';
import enMessages from '../../locales/en.json';
import arMessages from '../../locales/ar.json';
import bgMessages from '../../locales/bg.json';
import caMessages from '../../locales/ca.json';
import csMessages from '../../locales/cs.json';
import daMessages from '../../locales/da.json';
import deMessages from '../../locales/de.json';
import elMessages from '../../locales/el.json';
import esMessages from '../../locales/es.json';
import fiMessages from '../../locales/fi.json';
import frMessages from '../../locales/fr.json';
import heMessages from '../../locales/he.json';
import hiMessages from '../../locales/hi.json';
import hrMessages from '../../locales/hr.json';
import huMessages from '../../locales/hu.json';
import idMessages from '../../locales/id.json';
import itMessages from '../../locales/it.json';
import jaMessages from '../../locales/ja.json';
import koMessages from '../../locales/ko.json';
import msMessages from '../../locales/ms.json';
import nlMessages from '../../locales/nl.json';
import noMessages from '../../locales/no.json';
import ptBRMessages from '../../locales/pt-BR.json';
import ptPTMessages from '../../locales/pt-PT.json';
import roMessages from '../../locales/ro.json';
import ruMessages from '../../locales/ru.json';
import skMessages from '../../locales/sk.json';
import svMessages from '../../locales/sv.json';
import thMessages from '../../locales/th.json';
import trMessages from '../../locales/tr.json';
import ukMessages from '../../locales/uk.json';
import viMessages from '../../locales/vi.json';
import zhHansMessages from '../../locales/zh-Hans.json';
import zhHantMessages from '../../locales/zh-Hant.json';

/** 35 języków interfejsu (docs/lista-funkcji-mvp.md, pozycja 35). Zgodne z plikami w locales/. */
export const LANGS = [
  'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it',
  'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk',
  'vi', 'zh-Hans', 'zh-Hant', 'en',
] as const;

export type LangCode = (typeof LANGS)[number];

/** Język zapasowy dla brakujących kluczy. */
export const FALLBACK_LANG: LangCode = 'en';

/** Typ kluczy wyznaczony przez słownik źródłowy PL. */
export type Translations = typeof plMessages;

/** Drzewo tekstów: liście to stringi, węzły to obiekty. */
export type MessageTree = { readonly [key: string]: string | MessageTree };

/** Słownik może być niepełny; brakujące liście uzupełnia `mergeWithFallback`. */
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };

export const DICTIONARIES: Record<LangCode, DeepPartial<Translations>> = {
  ar: arMessages,
  bg: bgMessages,
  ca: caMessages,
  cs: csMessages,
  da: daMessages,
  de: deMessages,
  el: elMessages,
  en: enMessages,
  es: esMessages,
  fi: fiMessages,
  fr: frMessages,
  he: heMessages,
  hi: hiMessages,
  hr: hrMessages,
  hu: huMessages,
  id: idMessages,
  it: itMessages,
  ja: jaMessages,
  ko: koMessages,
  ms: msMessages,
  nl: nlMessages,
  no: noMessages,
  pl: plMessages,
  'pt-BR': ptBRMessages,
  'pt-PT': ptPTMessages,
  ro: roMessages,
  ru: ruMessages,
  sk: skMessages,
  sv: svMessages,
  th: thMessages,
  tr: trMessages,
  uk: ukMessages,
  vi: viMessages,
  'zh-Hans': zhHansMessages,
  'zh-Hant': zhHantMessages,
};

const FALLBACK_MESSAGES: Translations = enMessages;

const ALIASES = new Map<string, LangCode>([
  ['nb', 'no'],
  ['nn', 'no'],
  ['iw', 'he'],
  ['in', 'id'],
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** Wartość ustawienia „Język systemu” (brak wyboru użytkownika). */
export const SYSTEM_LANGUAGE = 'system' as const;

/** Ustawienie języka: kod z LANGS albo „system” (język urządzenia). */
export type LanguageSetting = LangCode | typeof SYSTEM_LANGUAGE;

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === SYSTEM_LANGUAGE || isLangCode(value);
}

/** Każda wartość spoza listy (także uszkodzona lub pusta) oznacza język systemu. */
export function parseLanguageSetting(value: unknown): LanguageSetting {
  return isLanguageSetting(value) ? value : SYSTEM_LANGUAGE;
}

/**
 * Dopasowuje tag języka systemu (np. `pt_BR`, `de-AT`, `zh-TW`) do obsługiwanego kodu.
 * Zwraca null, gdy nie ma dopasowania (wtedy decyduje język zapasowy).
 */
export function matchSystemLocale(tag: string | null | undefined): LangCode | null {
  if (typeof tag !== 'string') return null;
  const parts = tag.trim().replace(/_/g, '-').toLowerCase().split('-');
  const base = parts[0];
  if (!base) return null;

  const full = parts.join('-');
  const exact = LANGS.find((lang) => lang.toLowerCase() === full);
  if (exact) return exact;

  if (base === 'zh') {
    const traditional = parts.some((part) => part === 'hant' || part === 'tw' || part === 'hk' || part === 'mo');
    return traditional ? 'zh-Hant' : 'zh-Hans';
  }
  // Portugalski bez wskazanego regionu (lub inny region niż PT) -> pt-BR, większy rynek.
  if (base === 'pt') return 'pt-BR';

  const alias = ALIASES.get(base);
  if (alias) return alias;

  return LANGS.find((lang) => lang.toLowerCase() === base) ?? null;
}

/**
 * Wybór języka: ustawienie użytkownika (jeśli obsługiwane) -> język systemu -> en.
 */
export function resolveLanguage(userSetting: unknown, systemLocale: string | null | undefined): LangCode {
  if (isLangCode(userSetting)) return userSetting;
  return matchSystemLocale(systemLocale) ?? FALLBACK_LANG;
}

/**
 * Łączy słownik języka z zapasowym: każda brakująca (lub pusta) liść z `primary`
 * pochodzi z `fallback`. `onFallback` dostaje ścieżkę każdej uzupełnionej liści.
 */
export function mergeWithFallback<T extends MessageTree>(
  primary: DeepPartial<T> | undefined,
  fallback: T,
  onFallback?: (path: string) => void,
  prefix = ''
): T {
  const source = (primary ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(fallback)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const fallbackValue = fallback[key];
    const ownValue = source[key];
    if (isRecord(fallbackValue)) {
      out[key] = mergeWithFallback(
        isRecord(ownValue) ? (ownValue as DeepPartial<MessageTree>) : undefined,
        fallbackValue as MessageTree,
        onFallback,
        path
      );
    } else if (hasText(ownValue)) {
      out[key] = ownValue;
    } else {
      onFallback?.(path);
      out[key] = fallbackValue;
    }
  }
  return out as T;
}

/** Odczyt liścia po ścieżce z kropkami; pusty tekst traktowany jak brak. */
export function lookupMessage(tree: unknown, path: string): string | undefined {
  let node: unknown = tree;
  for (const part of path.split('.')) {
    if (!isRecord(node) || !Object.prototype.hasOwnProperty.call(node, part)) return undefined;
    node = node[part];
  }
  return hasText(node) ? node : undefined;
}

/**
 * Tekst dla dynamicznego klucza: język docelowy -> en -> sam klucz.
 * `onMissing` wywoływane, gdy język docelowy nie ma klucza (np. ostrzeżenie w dev).
 */
export function resolveMessage(
  path: string,
  lang: LangCode,
  onMissing?: (path: string, lang: LangCode) => void
): string {
  const own = lookupMessage(DICTIONARIES[lang], path);
  if (own !== undefined) return own;
  onMissing?.(path, lang);
  return lookupMessage(DICTIONARIES[FALLBACK_LANG], path) ?? path;
}

/** Kompletny słownik języka: własne wartości, brakujące z en. */
export function buildMessages(
  lang: LangCode,
  onMissing?: (path: string, lang: LangCode) => void
): Translations {
  return mergeWithFallback<Translations>(DICTIONARIES[lang], FALLBACK_MESSAGES, (path) =>
    onMissing?.(path, lang)
  );
}

const messagesCache: Partial<Record<LangCode, Translations>> = {};

/** Słownik języka liczony raz na język (dla komponentów i modułów core, które dostają język jako argument). */
export function messagesFor(lang: LangCode): Translations {
  const cached = messagesCache[lang];
  if (cached) return cached;
  const built = buildMessages(lang);
  messagesCache[lang] = built;
  return built;
}

/**
 * Dane dwujęzyczne (np. namePl / nameEn w przepisach, sensoryce, komunikatach):
 * wartość PL tylko dla języka polskiego, dla wszystkich pozostałych 34 języków wartość EN (fallback).
 */
export function pickBilingual<T>(lang: string, pl: T, en: T): T {
  return lang === 'pl' ? pl : en;
}
