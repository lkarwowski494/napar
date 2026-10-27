// ============================================================================
// Napar (Steepwise) — App Access & Monetization Engine ("Cheaper than Espresso")
// Zero feature-gating during trial (100% features available).
// Free Core (WTP-0): Brewing timer, ratio calculator, and history are forever free.
// Pro Features (WTP-1): Stash > 3 beans, custom recipes, water chemistry, dial-in Doctor.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from './database';

export const TRIAL_MAX_BREWS = 15;
export const TRIAL_DURATION_DAYS = 14;

export const STORE_PRODUCT_IDS = {
  monthly: 'pl.lukasz.napar.monthly',
  annual: 'pl.lukasz.napar.annual',
  lifetime: 'pl.lukasz.napar.lifetime',
} as const;

export interface StoreKitReceipt {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  signature: string;
}

export type AppAccessStatus = 'trial_active' | 'trial_expired' | 'subscribed';

export interface AppAccessState {
  status: AppAccessStatus;
  brewsCount: number;
  brewsRemaining: number;
  daysRemaining: number;
  isSubscribed: boolean;
  canCreate: boolean;
  isHistoryReadOnly: boolean;
  subscriptionTier: 'none' | 'monthly' | 'annual' | 'lifetime';
}

type AccessChangeListener = (state: AppAccessState) => void;
const listeners = new Set<AccessChangeListener>();

export function subscribeAccessChanges(listener: AccessChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearAccessListenersForTesting(): void {
  listeners.clear();
}

export function notifyAccessChanged(): void {
  const state = getAppAccessState();
  for (const listener of listeners) {
    try {
      listener(state);
    } catch {
      // Ignoruj błędy pojedynczego subskrybenta
    }
  }
}

export function getAppAccessState(): AppAccessState {
  const isPro = getAppSetting('is_pro_active', 'false') === 'true';
  const rawTier = getAppSetting('subscription_tier', isPro ? 'lifetime' : 'none');
  const normalizedTierStr = typeof rawTier === 'string'
    ? rawTier.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase()
    : '';
  const tier: 'none' | 'monthly' | 'annual' | 'lifetime' =
    normalizedTierStr === 'monthly' || normalizedTierStr === 'annual' || normalizedTierStr === 'lifetime'
      ? (normalizedTierStr as 'monthly' | 'annual' | 'lifetime')
      : 'none';

  if (isPro) {
    return {
      status: 'subscribed',
      brewsCount: 0,
      brewsRemaining: Infinity,
      daysRemaining: Infinity,
      isSubscribed: true,
      canCreate: true,
      isHistoryReadOnly: false,
      subscriptionTier: tier === 'none' ? 'lifetime' : tier,
    };
  }

  // Sprawdź datę pierwszej instalacji
  const rawStarted = getAppSetting('trial_started_at', '');
  let trialStartedAt = typeof rawStarted === 'string' ? rawStarted.trim() : '';
  const now = new Date();
  let parsedStartTime = NaN;
  if (trialStartedAt) {
    try {
      const d = new Date(trialStartedAt);
      parsedStartTime = d.getTime();
    } catch {
      parsedStartTime = NaN;
    }
  }
  if (!trialStartedAt || !Number.isFinite(parsedStartTime) || parsedStartTime <= 0) {
    trialStartedAt = now.toISOString();
    parsedStartTime = now.getTime();
    setAppSetting('trial_started_at', trialStartedAt);
  }

  const startTime = Number.isFinite(parsedStartTime) ? parsedStartTime : now.getTime();
  const elapsedMs = Math.max(0, now.getTime() - startTime);
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const rawMaxDaysSetting = getAppSetting('trial_max_days_seen', '0');
  const rawMaxDays = typeof rawMaxDaysSetting === 'number' ? rawMaxDaysSetting : parseInt(String(rawMaxDaysSetting), 10);
  const maxDaysSeen = Number.isFinite(rawMaxDays) && rawMaxDays > 0 ? Math.floor(rawMaxDays) : 0;
  const rawEffectiveElapsedDays = Math.floor(Math.max(0, Math.max(elapsedDays, maxDaysSeen)));
  const effectiveElapsedDays = Object.is(rawEffectiveElapsedDays, -0) || rawEffectiveElapsedDays <= 0 ? 0 : rawEffectiveElapsedDays;
  if (elapsedDays > maxDaysSeen) {
    setAppSetting('trial_max_days_seen', String(elapsedDays));
  }
  const rawDaysRemaining = Math.floor(Math.max(0, Math.min(TRIAL_DURATION_DAYS, TRIAL_DURATION_DAYS - effectiveElapsedDays)));
  const daysRemaining = Object.is(rawDaysRemaining, -0) || rawDaysRemaining <= 0 ? 0 : rawDaysRemaining;

  const rawBrewsSetting = getAppSetting('trial_brews_count', '0');
  const rawBrews = typeof rawBrewsSetting === 'number' ? rawBrewsSetting : parseInt(String(rawBrewsSetting), 10);
  const brewsCount = Number.isFinite(rawBrews) && rawBrews > 0 ? Math.floor(rawBrews) : 0;
  const rawMaxBrewsSetting = getAppSetting('trial_max_brews_seen', '0');
  const rawMaxBrews = typeof rawMaxBrewsSetting === 'number' ? rawMaxBrewsSetting : parseInt(String(rawMaxBrewsSetting), 10);
  const maxBrewsSeen = Number.isFinite(rawMaxBrews) && rawMaxBrews > 0 ? Math.floor(rawMaxBrews) : 0;
  const rawEffectiveBrewsCount = Math.floor(Math.max(0, Math.max(brewsCount, maxBrewsSeen)));
  const effectiveBrewsCount = Object.is(rawEffectiveBrewsCount, -0) || rawEffectiveBrewsCount <= 0 ? 0 : rawEffectiveBrewsCount;
  if (brewsCount > maxBrewsSeen) {
    setAppSetting('trial_max_brews_seen', String(brewsCount));
  }
  const rawBrewsRemaining = Math.floor(Math.max(0, Math.min(TRIAL_MAX_BREWS, TRIAL_MAX_BREWS - effectiveBrewsCount)));
  const brewsRemaining = Object.is(rawBrewsRemaining, -0) || rawBrewsRemaining <= 0 ? 0 : rawBrewsRemaining;

  const isExpired = effectiveBrewsCount >= TRIAL_MAX_BREWS || effectiveElapsedDays >= TRIAL_DURATION_DAYS;

  if (isExpired) {
    return {
      status: 'trial_expired',
      brewsCount: effectiveBrewsCount,
      brewsRemaining: 0,
      daysRemaining: 0,
      isSubscribed: false,
      canCreate: false,
      isHistoryReadOnly: true,
      subscriptionTier: 'none',
    };
  }

  return {
    status: 'trial_active',
    brewsCount: effectiveBrewsCount,
    brewsRemaining,
    daysRemaining,
    isSubscribed: false,
    canCreate: true,
    isHistoryReadOnly: false,
    subscriptionTier: 'none',
  };
}

/**
 * Zwraca liczbę dni pozostałych w okresie próbnym, gwarantując zakres [0, TRIAL_DURATION_DAYS] lub Infinity dla subskrypcji.
 */
export function getTrialDaysRemaining(): number {
  const state = getAppAccessState();
  if (state.isSubscribed) return Infinity;
  if (state.status === 'trial_expired') return 0;
  const days = Number.isFinite(state.daysRemaining) && state.daysRemaining >= 0
    ? Math.floor(Math.min(TRIAL_DURATION_DAYS, state.daysRemaining))
    : 0;
  return Object.is(days, -0) ? 0 : days;
}

/**
 * Zwraca liczbę parzeń pozostałych w okresie próbnym, gwarantując zakres [0, TRIAL_MAX_BREWS] lub Infinity dla subskrypcji.
 */
export function getTrialBrewsRemaining(): number {
  const state = getAppAccessState();
  if (state.isSubscribed) return Infinity;
  if (state.status === 'trial_expired') return 0;
  const brews = Number.isFinite(state.brewsRemaining) && state.brewsRemaining >= 0
    ? Math.floor(Math.min(TRIAL_MAX_BREWS, state.brewsRemaining))
    : 0;
  return Object.is(brews, -0) ? 0 : brews;
}

/**
 * Zwraca spójne tekstowe podsumowanie stanu okresu próbnego / subskrypcji.
 */
/**
 * Zwraca czytelną, zlokalizowaną nazwę poziomu subskrypcji
 */
export function formatSubscriptionTierName(
  tier: string | undefined | null,
  language: 'pl' | 'en' | string = 'pl'
): string {
  const isEn = typeof language === 'string' && (language.trim().toLowerCase() === 'en' || language.trim().toLowerCase().startsWith('en'));
  let cleanTier = typeof tier === 'string'
    ? tier.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase()
    : '';
  if (cleanTier === STORE_PRODUCT_IDS.monthly.toLowerCase() || cleanTier.includes('monthly')) cleanTier = 'monthly';
  else if (cleanTier === STORE_PRODUCT_IDS.annual.toLowerCase() || cleanTier.includes('annual')) cleanTier = 'annual';
  else if (cleanTier === STORE_PRODUCT_IDS.lifetime.toLowerCase() || cleanTier.includes('lifetime')) cleanTier = 'lifetime';

  switch (cleanTier) {
    case 'monthly':
      return isEn ? 'Monthly Pass' : 'Subskrypcja Miesięczna';
    case 'annual':
      return isEn ? 'Annual Pass' : 'Subskrypcja Roczna';
    case 'lifetime':
      return isEn ? 'Lifetime Pass' : 'Dostęp Dożywotni';
    default:
      return isEn ? 'No active pass' : 'Brak subskrypcji';
  }
}

export function formatTrialStatusSummary(
  state: AppAccessState,
  language: 'pl' | 'en' | string = 'pl'
): string {
  const isEn = typeof language === 'string' && (language.trim().toLowerCase() === 'en' || language.trim().toLowerCase().startsWith('en'));
  if (!state || typeof state !== 'object') {
    return isEn ? 'Trial status unknown' : 'Stan okresu próbnego nieznany';
  }
  if (state.isSubscribed) {
    return isEn ? 'Apps4Brew Pass Active' : 'Apps4Brew Pass Aktywny';
  }
  if (state.status === 'trial_expired') {
    return isEn ? 'Trial expired' : 'Okres próbny zakończony';
  }
  const rawBrewsVal = typeof state.brewsRemaining === 'number'
    ? state.brewsRemaining
    : (typeof (state as any).brewsRemaining === 'string'
        ? (() => {
            const m = String((state as any).brewsRemaining).replace(',', '.').trim().match(/^[+-]?\d+(?:\.\d+)?/);
            return m ? parseFloat(m[0]) : 0;
          })()
        : 0);
  const rawBrews = Number.isFinite(rawBrewsVal) && rawBrewsVal >= 0
    ? Math.floor(rawBrewsVal)
    : 0;
  const brews = Object.is(rawBrews, -0) || isNaN(rawBrews) ? 0 : rawBrews;

  const rawDaysVal = typeof state.daysRemaining === 'number'
    ? state.daysRemaining
    : (typeof (state as any).daysRemaining === 'string'
        ? (() => {
            const m = String((state as any).daysRemaining).replace(',', '.').trim().match(/^[+-]?\d+(?:\.\d+)?/);
            return m ? parseFloat(m[0]) : 0;
          })()
        : 0);
  const rawDays = Number.isFinite(rawDaysVal) && rawDaysVal >= 0
    ? Math.floor(rawDaysVal)
    : 0;
  const days = Object.is(rawDays, -0) || isNaN(rawDays) ? 0 : rawDays;

  if (isEn) {
    const brewWord = brews === 1 ? 'brew' : 'brews';
    const dayWord = days === 1 ? 'day' : 'days';
    return `Trial: ${brews} ${brewWord} · ${days} ${dayWord} remaining`;
  }
  let brewUnit = 'parzeń';
  if (brews === 1) {
    brewUnit = 'parzenie';
  } else {
    const mod10 = brews % 10;
    const mod100 = brews % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      brewUnit = 'parzenia';
    }
  }
  const dayUnit = days === 1 ? 'dzień' : 'dni';
  return `Okres próbny: ${brews} ${brewUnit} · ${days} ${dayUnit}`;
}

export function formatTrialBadgeText(
  state?: AppAccessState | null,
  language: 'pl' | 'en' | string = 'pl'
): string {
  const safeState = state && typeof state === 'object' ? state : getAppAccessState();
  return formatTrialStatusSummary(safeState, language);
}

/**
 * Sprawdza czy użytkownik posiada pełne uprawnienia rzemieślnicze (Apps4Brew Pro).
 * Zwraca true jeśli subskrypcja jest aktywna LUB jeśli trwa bezpłatny okres próbny (trial_active).
 */
export function isProAccessGranted(state?: AppAccessState | null): boolean {
  const current = state && typeof state === 'object' ? state : getAppAccessState();
  return Boolean(current.isSubscribed || current.status === 'trial_active');
}

const FREE_CORE_FEATURES = new Set([
  'timer',
  'ratio',
  'history',
  'journal_read',
  'browse_recipes',
  'basic_calc',
]);

/**
 * Sprawdza czy dana funkcja wymaga aktywnego pakietu Napar Pro / Apps4Brew Pass.
 * Zgodnie z filozofią WTP-0: podstawowy stoper, proporcje i historia są darmowe na zawsze.
 * W trakcie trialu (trial_active) 100% funkcji jest dostępnych.
 */
export function isFeatureGated(
  feature: string,
  state?: AppAccessState | null
): boolean {
  if (isProAccessGranted(state)) {
    return false;
  }
  const cleanFeature = (typeof feature === 'string' ? feature : '').trim().toLowerCase();
  if (FREE_CORE_FEATURES.has(cleanFeature)) {
    return false;
  }
  return true;
}

/**
 * Zwraca zlokalizowany komunikat informujący o wymaganiu licencji Pro dla zablokowanej funkcji.
 */
export function getGatedFeatureNotice(
  feature: string,
  language: 'pl' | 'en' | string = 'pl'
): { title: string; message: string } {
  const isEn = typeof language === 'string' && (language.toLowerCase() === 'en' || language.toLowerCase().startsWith('en'));
  const clean = (typeof feature === 'string' ? feature : '').trim().toLowerCase();

  switch (clean) {
    case 'custom_recipes':
      return {
        title: isEn ? 'Custom Recipes (Pro)' : 'Własne receptury (Pro)',
        message: isEn
          ? 'Creating and tweaking custom brewing profiles requires Napar Pro / Apps4Brew Pass.'
          : 'Tworzenie i edycja własnych profili parzenia wymaga licencji Napar Pro / Apps4Brew Pass.',
      };
    case 'water_chemistry':
      return {
        title: isEn ? 'Water Chemistry (Pro)' : 'Chemia i minerały wody (Pro)',
        message: isEn
          ? 'Mineral water calculator and bottled benchmarks require Napar Pro.'
          : 'Kalkulator mineralizacji wody i benchmarki wód butelkowanych wymagają licencji Napar Pro.',
      };
    case 'unlimited_beans':
      return {
        title: isEn ? 'Unlimited Coffee Stash (Pro)' : 'Nielimitowana spiżarnia kawy (Pro)',
        message: isEn
          ? 'Tracking more than 3 specialty coffees requires Napar Pro.'
          : 'Zarządzanie więcej niż 3 paczkami specialty w spiżarni wymaga licencji Napar Pro.',
      };
    case 'dialin_doctor':
      return {
        title: isEn ? 'Dial-in Doctor (Pro)' : 'Dial-in Doctor (Pro)',
        message: isEn
          ? 'Sensory extraction diagnostics and grind optimization require Napar Pro.'
          : 'Sensoryczna diagnostyka ekstrakcji i optymalizacja przemiału wymagają licencji Napar Pro.',
      };
    default:
      return {
        title: isEn ? 'Napar Pro Feature' : 'Funkcja Napar Pro',
        message: isEn
          ? 'Upgrade to Napar Pro or Apps4Brew Pass to unlock this specialty feature.'
          : 'Aktywuj licencję Napar Pro lub Apps4Brew Pass, aby odblokować tę funkcję specialty.',
      };
  }
}


/**
 * Mapuje identyfikator produktu StoreKit na wewnętrzny poziom subskrypcji.
 */
export function getSubscriptionTierFromProductId(
  productId: string | undefined | null
): 'monthly' | 'annual' | 'lifetime' | 'none' {
  if (!productId || typeof productId !== 'string') return 'none';
  const clean = productId
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .toLowerCase();

  if (clean === STORE_PRODUCT_IDS.lifetime.toLowerCase() || clean.includes('lifetime')) {
    return 'lifetime';
  }
  if (clean === STORE_PRODUCT_IDS.annual.toLowerCase() || clean.includes('annual')) {
    return 'annual';
  }
  if (clean === STORE_PRODUCT_IDS.monthly.toLowerCase() || clean.includes('monthly')) {
    return 'monthly';
  }
  return 'none';
}

export function recordBrewCompleted(): AppAccessState {
  const current = getAppAccessState();
  if (current.isSubscribed) {
    return current;
  }
  const rawBrews = current.brewsCount;
  const currentCount = Number.isFinite(rawBrews) && rawBrews >= 0 && !Object.is(rawBrews, -0) ? Math.floor(rawBrews) : 0;
  let newCount = Math.min(TRIAL_MAX_BREWS + 10, currentCount + 1);
  if (Object.is(newCount, -0) || newCount < 0) newCount = 0;
  setAppSetting('trial_brews_count', String(newCount));
  setAppSetting('trial_max_brews_seen', String(newCount));
  const state = getAppAccessState();
  notifyAccessChanged();
  return state;
}

export function activateSubscription(tier: 'monthly' | 'annual' | 'lifetime'): AppAccessState {
  const allowedTiers: readonly string[] = ['monthly', 'annual', 'lifetime'];
  let cleanTier = typeof tier === 'string'
    ? tier.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase()
    : '';
  if (cleanTier === STORE_PRODUCT_IDS.monthly.toLowerCase() || cleanTier.includes('monthly')) cleanTier = 'monthly';
  else if (cleanTier === STORE_PRODUCT_IDS.annual.toLowerCase() || cleanTier.includes('annual')) cleanTier = 'annual';
  else if (cleanTier === STORE_PRODUCT_IDS.lifetime.toLowerCase() || cleanTier.includes('lifetime')) cleanTier = 'lifetime';

  const safeTier = (allowedTiers.includes(cleanTier) ? cleanTier : 'annual') as 'monthly' | 'annual' | 'lifetime';
  setAppSetting('is_pro_active', 'true');
  setAppSetting('subscription_tier', safeTier);
  setAppSetting('has_verified_purchase', 'true');
  setAppSetting('verified_purchase_tier', safeTier);
  const state = getAppAccessState();
  notifyAccessChanged();
  return state;
}

export type RestorePurchasesResult = AppAccessState & {
  restored: boolean;
  receipt?: StoreKitReceipt;
};

export function restorePurchases(): RestorePurchasesResult {
  const verifiedVal = getAppSetting('has_verified_purchase', 'false');
  const hasVerifiedPurchase = verifiedVal === 'true' || verifiedVal === '1';
  const rawTier = getAppSetting('verified_purchase_tier', '');
  const cleanTier = typeof rawTier === 'string' ? rawTier.trim().toLowerCase() : '';
  const rawSubTier = getAppSetting('subscription_tier', '');
  const cleanSubTier = typeof rawSubTier === 'string' ? rawSubTier.trim().toLowerCase() : '';

  const allowedTiers: readonly string[] = ['monthly', 'annual', 'lifetime'];
  let effectiveTier: 'monthly' | 'annual' | 'lifetime' | null = null;
  if (allowedTiers.includes(cleanTier)) {
    effectiveTier = cleanTier as 'monthly' | 'annual' | 'lifetime';
  } else if (!cleanTier && allowedTiers.includes(cleanSubTier)) {
    effectiveTier = cleanSubTier as 'monthly' | 'annual' | 'lifetime';
  }

  if (hasVerifiedPurchase && effectiveTier) {
    setAppSetting('is_pro_active', 'true');
    setAppSetting('subscription_tier', effectiveTier);
    setAppSetting('verified_purchase_tier', effectiveTier);
    let receipt: StoreKitReceipt | undefined;
    const rawReceiptJson = getAppSetting('verified_receipt_json', '');
    const receiptJson = typeof rawReceiptJson === 'string' ? rawReceiptJson.replace(/^\uFEFF/, '').trim() : '';
    if (receiptJson) {
      try {
        const parsed = JSON.parse(receiptJson);
        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          typeof parsed.productId === 'string' &&
          parsed.productId.replace(/[\x00-\x1F\x7F]/g, '').trim() &&
          typeof parsed.transactionId === 'string' &&
          parsed.transactionId.replace(/[\x00-\x1F\x7F]/g, '').trim() &&
          typeof parsed.purchaseDate === 'string' &&
          parsed.purchaseDate.replace(/[\x00-\x1F\x7F]/g, '').trim() &&
          typeof parsed.signature === 'string' &&
          parsed.signature.replace(/[\x00-\x1F\x7F]/g, '').trim()
        ) {
          receipt = {
            productId: parsed.productId.replace(/[\x00-\x1F\x7F]/g, '').trim(),
            transactionId: parsed.transactionId.replace(/[\x00-\x1F\x7F]/g, '').trim(),
            purchaseDate: parsed.purchaseDate.replace(/[\x00-\x1F\x7F]/g, '').trim(),
            signature: parsed.signature.replace(/[\x00-\x1F\x7F]/g, '').trim(),
          };
        }
      } catch {
        // Ignoruj błąd parsowania
      }
    }
    const state = getAppAccessState();
    notifyAccessChanged();
    return { ...state, restored: true, receipt };
  }

  // Brak legalnego dowodu zakupu — nie rozdajemy darmowego Lifetime
  const state = getAppAccessState();
  notifyAccessChanged();
  return { ...state, restored: false };
}

export interface StoreKitVerificationResult {
  success: boolean;
  tier?: 'monthly' | 'annual' | 'lifetime';
  receipt?: StoreKitReceipt;
  error?: string;
  errorCode?: 'invalid_signature' | 'unknown_product';
}

export function verifyAndActivateStoreKitPurchase(
  receipt: StoreKitReceipt
): StoreKitVerificationResult {
  if (
    !receipt ||
    typeof receipt !== 'object' ||
    Array.isArray(receipt) ||
    typeof receipt.transactionId !== 'string' ||
    !receipt.transactionId.trim() ||
    typeof receipt.signature !== 'string' ||
    typeof receipt.purchaseDate !== 'string'
  ) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const cleanSignature = receipt.signature
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  if (!cleanSignature || cleanSignature.length < 8) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const cleanPurchaseDate = receipt.purchaseDate
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  if (!cleanPurchaseDate || isNaN(new Date(cleanPurchaseDate).getTime())) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const cleanProductId = typeof receipt.productId === 'string'
    ? receipt.productId.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase()
    : '';
  let tier: 'monthly' | 'annual' | 'lifetime' | null = null;
  if (cleanProductId === STORE_PRODUCT_IDS.monthly.toLowerCase() || cleanProductId === 'monthly') tier = 'monthly';
  else if (cleanProductId === STORE_PRODUCT_IDS.annual.toLowerCase() || cleanProductId === 'annual') tier = 'annual';
  else if (cleanProductId === STORE_PRODUCT_IDS.lifetime.toLowerCase() || cleanProductId === 'lifetime') tier = 'lifetime';

  if (!tier) {
    return {
      success: false,
      error: 'Nieznany identyfikator produktu StoreKit',
      errorCode: 'unknown_product',
    };
  }

  const purchaseTime = new Date(cleanPurchaseDate).getTime();
  const maxAllowedFutureTime = Date.now() + 86400000; // max 24h w przyszłość (ochrona przed manipulacją datami)
  if (isNaN(purchaseTime) || purchaseTime <= 0 || purchaseTime > maxAllowedFutureTime) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const cleanTransactionId = receipt.transactionId
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 256);

  if (!cleanTransactionId) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const sanitizedReceipt: StoreKitReceipt = {
    productId: STORE_PRODUCT_IDS[tier],
    transactionId: cleanTransactionId,
    purchaseDate: cleanPurchaseDate,
    signature: cleanSignature,
  };

  setAppSetting('is_pro_active', 'true');
  setAppSetting('subscription_tier', tier);
  setAppSetting('has_verified_purchase', 'true');
  setAppSetting('verified_purchase_tier', tier);
  setAppSetting('verified_receipt_json', JSON.stringify(sanitizedReceipt));

  const state = getAppAccessState();
  notifyAccessChanged();

  return { success: true, tier, receipt: sanitizedReceipt };
}

export function resetTrialForTesting(): void {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    throw new Error('resetTrialForTesting jest dozwolone wyłącznie w środowisku testowym / __DEV__.');
  }
  setAppSetting('is_pro_active', 'false');
  setAppSetting('subscription_tier', 'none');
  setAppSetting('has_verified_purchase', 'false');
  setAppSetting('verified_purchase_tier', '');
  setAppSetting('verified_receipt_json', '');
  setAppSetting('trial_brews_count', '0');
  setAppSetting('trial_max_brews_seen', '0');
  setAppSetting('trial_max_days_seen', '0');
  setAppSetting('trial_started_at', new Date().toISOString());
  notifyAccessChanged();
}

export function setTrialExpiredForTesting(): void {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    throw new Error('setTrialExpiredForTesting jest dozwolone wyłącznie w środowisku testowym / __DEV__.');
  }
  setAppSetting('is_pro_active', 'false');
  setAppSetting('subscription_tier', 'none');
  setAppSetting('has_verified_purchase', 'false');
  setAppSetting('verified_purchase_tier', '');
  setAppSetting('verified_receipt_json', '');
  setAppSetting('trial_brews_count', String(TRIAL_MAX_BREWS));
  setAppSetting('trial_max_brews_seen', String(TRIAL_MAX_BREWS));
  setAppSetting('trial_max_days_seen', String(TRIAL_DURATION_DAYS));
  notifyAccessChanged();
}

export function purchaseWithStoreKit(
  tier: 'monthly' | 'annual' | 'lifetime'
): StoreKitVerificationResult {
  const cleanTier = typeof tier === 'string' ? tier.trim().toLowerCase() : '';
  const safeTier = cleanTier === 'monthly' || cleanTier === 'annual' || cleanTier === 'lifetime' ? cleanTier : 'annual';
  const state = activateSubscription(safeTier);
  const activeTier = (state.subscriptionTier !== 'none' ? state.subscriptionTier : 'annual') as 'monthly' | 'annual' | 'lifetime';
  const receipt: StoreKitReceipt = {
    productId: STORE_PRODUCT_IDS[activeTier],
    transactionId: `mock-storekit-tx-${Date.now()}`,
    purchaseDate: new Date().toISOString(),
    signature: `valid-receipt-signature-${activeTier}`,
  };
  setAppSetting('verified_receipt_json', JSON.stringify(receipt));
  return {
    success: true,
    tier: activeTier,
    receipt,
  };
}

export function useAppAccess() {
  const [access, setAccess] = useState<AppAccessState>(() => getAppAccessState());

  useEffect(() => {
    const unsubscribe = subscribeAccessChanges((next) => {
      setAccess(next);
    });
    return unsubscribe;
  }, []);

  const refresh = () => {
    const next = getAppAccessState();
    setAccess(next);
    notifyAccessChanged();
  };

  const subscribe = (tier: 'monthly' | 'annual' | 'lifetime') => {
    const updated = activateSubscription(tier);
    setAccess(updated);
  };

  const restore = (): RestorePurchasesResult => {
    const res = restorePurchases();
    setAccess(res);
    return res;
  };

  const purchase = (tier: 'monthly' | 'annual' | 'lifetime' = 'annual'): StoreKitVerificationResult => {
    const res = purchaseWithStoreKit(tier);
    if (res.success) {
      setAccess(getAppAccessState());
    }
    return res;
  };

  const recordBrew = () => {
    const updated = recordBrewCompleted();
    setAccess(updated);
  };

  return {
    ...access,
    refresh,
    subscribe,
    purchaseWithStoreKit: purchase,
    purchase,
    restore,
    recordBrew,
  };
}

export interface TierPricingInfo {
  tier: 'monthly' | 'annual' | 'lifetime';
  productId: string;
  priceFormatted: string;
  periodLabel: string;
  monthlyEquivalentFormatted?: string;
  savingsDescription?: string;
  anchorComparison: string;
}

/**
 * Zwraca zlokalizowany cennik, etykiety okresów oraz kotwice cenowe "Cheaper than Espresso"
 * dla wybranego planu subskrypcji w zdefiniowanej walucie (PLN, EUR, USD, GBP).
 */
export function getTierPricingInfo(
  tier: 'monthly' | 'annual' | 'lifetime' | string,
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP' | string = 'PLN',
  language: 'pl' | 'en' | string = 'pl'
): TierPricingInfo {
  const cleanTierStr = typeof tier === 'string'
    ? tier.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase()
    : '';
  const safeTier: 'monthly' | 'annual' | 'lifetime' =
    cleanTierStr === 'monthly' || cleanTierStr === 'lifetime' ? cleanTierStr : 'annual';

  const cleanCurr = typeof currency === 'string'
    ? currency.replace(/\uFEFF/g, '').trim().toUpperCase()
    : 'PLN';
  const safeCurr: 'PLN' | 'EUR' | 'USD' | 'GBP' =
    cleanCurr === 'EUR' || cleanCurr === 'USD' || cleanCurr === 'GBP' ? cleanCurr : 'PLN';

  const isEn = typeof language === 'string' && language.trim().toLowerCase().startsWith('en');

  const productId = STORE_PRODUCT_IDS[safeTier];

  if (safeTier === 'monthly') {
    const prices: Record<string, string> = {
      PLN: '8.99 zł',
      EUR: '€1.99',
      USD: '$1.99',
      GBP: '£1.79',
    };
    return {
      tier: 'monthly',
      productId,
      priceFormatted: prices[safeCurr] || prices.PLN,
      periodLabel: isEn ? 'month' : 'miesiąc',
      anchorComparison: isEn ? 'Cheaper than a single cafe espresso' : 'Taniej niż pojedyncze espresso w kawiarni',
    };
  }

  if (safeTier === 'lifetime') {
    const prices: Record<string, string> = {
      PLN: '129.99 zł',
      EUR: '€29.99',
      USD: '$32.99',
      GBP: '£26.99',
    };
    return {
      tier: 'lifetime',
      productId,
      priceFormatted: prices[safeCurr] || prices.PLN,
      periodLabel: isEn ? 'lifetime' : 'na zawsze',
      anchorComparison: isEn ? 'One-time payment, lifetime access' : 'Jednorazowa opłata, dożywotni dostęp',
    };
  }

  // annual (default)
  const prices: Record<string, string> = {
    PLN: '59.99 zł',
    EUR: '€13.99',
    USD: '$14.99',
    GBP: '£11.99',
  };
  const monthlyEquivalents: Record<string, string> = {
    PLN: isEn ? '5.00 zł / mo' : '5.00 zł / mies.',
    EUR: isEn ? '€1.17 / mo' : '€1.17 / mies.',
    USD: isEn ? '$1.25 / mo' : '$1.25 / mies.',
    GBP: isEn ? '£1.00 / mo' : '£1.00 / mies.',
  };
  return {
    tier: 'annual',
    productId,
    priceFormatted: prices[safeCurr] || prices.PLN,
    periodLabel: isEn ? 'year' : 'rok',
    monthlyEquivalentFormatted: monthlyEquivalents[safeCurr] || monthlyEquivalents.PLN,
    savingsDescription: isEn ? 'Save 44%' : 'Oszczędzasz 44%',
    anchorComparison: isEn ? 'Less than 1 specialty coffee per month' : 'Mniej niż 1 kawa specialty miesięcznie',
  };
}


export interface PaywallFeatureHighlight {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Zwraca listę kluczowych funkcji i korzyści wersji Pro dla paywalla ("Cheaper than Espresso").
 */
export function getPaywallFeatureHighlights(
  language: 'pl' | 'en' | string = 'pl'
): PaywallFeatureHighlight[] {
  const isEn = typeof language === 'string' && language.trim().toLowerCase().startsWith('en');

  return [
    {
      id: 'stash_unlimited',
      title: isEn ? 'Unlimited Coffee & Tea Stash' : 'Nielimitowana spiżarnia kawy i herbaty',
      description: isEn
        ? 'Track all your bags, roast dates, resting windows, and freezer stash.'
        : 'Śledź wszystkie paczki, daty palenia, okna odpoczynku (resting) i mrożenie.',
      icon: 'cube-outline',
    },
    {
      id: 'water_chemistry',
      title: isEn ? 'Water Chemistry & Minerals' : 'Chemia i mineralizacja wody',
      description: isEn
        ? 'GH/KH calculators, Lotus / Barista Hustle mineral recipes, and SCA suitability.'
        : 'Kalkulator GH/KH, mineralizacja Lotus / Barista Hustle i ocena wody SCA.',
      icon: 'water-outline',
    },
    {
      id: 'dial_in_doctor',
      title: isEn ? 'Dial-in Doctor & Diagnostics' : 'Dial-in Doctor i diagnostyka smaku',
      description: isEn
        ? 'Smart sensory troubleshooting for sourness, bitterness, astringency, and channeling.'
        : 'Inteligentna analiza sensoryczna: kwasowość, gorycz, ściąganie i channeling.',
      icon: 'medkit-outline',
    },
    {
      id: 'extraction_profiler',
      title: isEn ? 'Extraction Profiling & TDS' : 'Profilowanie ekstrakcji i TDS',
      description: isEn
        ? 'Refractometer TDS/EY logs, brew chart mapping, and sensory radar charts.'
        : 'Rejestracja TDS i EY% z refraktometru, wykres Golden Cup i radar sensoryczny.',
      icon: 'analytics-outline',
    },
    {
      id: 'custom_recipes',
      title: isEn ? 'Custom Recipe Builder' : 'Kreator własnych receptur',
      description: isEn
        ? 'Multi-stage pulse pouring, bypass brew ratios, and seamless recipe export.'
        : 'Wieloetapowe zalewanie pulsacyjne, kalkulator bypass i bezstratny eksport receptur.',
      icon: 'flask-outline',
    },
    {
      id: 'offline_privacy',
      title: isEn ? '100% Offline & Private' : '100% Offline i prywatność',
      description: isEn
        ? 'Zero accounts, zero trackers, zero cloud lock-in. Your data belongs to you.'
        : 'Zero kont, zero trackerów, zero chmury. Twoje dane należą wyłącznie do Ciebie.',
      icon: 'shield-checkmark-outline',
    },
  ];
}

export interface SubscriptionBadgeInfo {
  tier: 'none' | 'monthly' | 'annual' | 'lifetime';
  status: AppAccessStatus;
  badgeLabel: string;
  badgeVariant: 'gold' | 'blue' | 'gray';
  isPro: boolean;
  expiresInDays?: number;
}

export function getSubscriptionBadgeInfo(
  state?: AppAccessState | null,
  language?: string | null
): SubscriptionBadgeInfo {
  const current = state && typeof state === 'object' && 'status' in state ? state : getAppAccessState();
  const isEn = typeof language === 'string' && language.trim().toLowerCase().startsWith('en');

  if (current.isSubscribed) {
    let tierLabel = 'PRO';
    if (current.subscriptionTier === 'lifetime') {
      tierLabel = isEn ? 'PRO Lifetime' : 'PRO Dożywotni';
    } else if (current.subscriptionTier === 'annual') {
      tierLabel = isEn ? 'PRO Annual' : 'PRO Roczny';
    } else if (current.subscriptionTier === 'monthly') {
      tierLabel = isEn ? 'PRO Monthly' : 'PRO Miesięczny';
    }
    return {
      tier: current.subscriptionTier,
      status: current.status,
      badgeLabel: tierLabel,
      badgeVariant: 'gold',
      isPro: true,
    };
  }

  if (current.status === 'trial_active') {
    const days = Number.isFinite(current.daysRemaining) && current.daysRemaining >= 0 ? current.daysRemaining : 0;
    const label = isEn ? `Trial (${days}d)` : `Próbny (${days} dni)`;
    return {
      tier: 'none',
      status: 'trial_active',
      badgeLabel: label,
      badgeVariant: 'blue',
      isPro: false,
      expiresInDays: days,
    };
  }

  return {
    tier: 'none',
    status: 'trial_expired',
    badgeLabel: isEn ? 'Free Plan' : 'Plan darmowy',
    badgeVariant: 'gray',
    isPro: false,
    expiresInDays: 0,
  };
}

export interface FeatureAccessLevel {
  featureId: string;
  isAccessible: boolean;
  requiresPro: boolean;
  accessReason: 'free_core' | 'trial_active' | 'subscribed' | 'paywall_gated';
  bannerTitlePl: string;
  bannerTitleEn: string;
}

/**
 * Zwraca szczegółowy poziom uprawnień użytkownika dla wybranej funkcji (Free Core, Trial, Pro, Paywall).
 */
export function getFeatureAccessLevel(
  feature: string | undefined | null,
  state?: AppAccessState | null
): FeatureAccessLevel {
  const current = state && typeof state === 'object' && 'status' in state ? state : getAppAccessState();
  const cleanFeature = (typeof feature === 'string' ? feature : '').trim().toLowerCase();
  const isFreeCore = FREE_CORE_FEATURES.has(cleanFeature);

  if (isFreeCore) {
    return {
      featureId: cleanFeature,
      isAccessible: true,
      requiresPro: false,
      accessReason: 'free_core',
      bannerTitlePl: 'Funkcja bezpłatna (Free Core)',
      bannerTitleEn: 'Free Core Feature',
    };
  }

  if (current.isSubscribed) {
    return {
      featureId: cleanFeature,
      isAccessible: true,
      requiresPro: true,
      accessReason: 'subscribed',
      bannerTitlePl: 'Odblokowano w pakiecie PRO',
      bannerTitleEn: 'Unlocked with PRO Pass',
    };
  }

  if (current.status === 'trial_active') {
    return {
      featureId: cleanFeature,
      isAccessible: true,
      requiresPro: true,
      accessReason: 'trial_active',
      bannerTitlePl: 'Dostępne w okresie próbnym (Trial)',
      bannerTitleEn: 'Available during Trial',
    };
  }

  return {
    featureId: cleanFeature,
    isAccessible: false,
    requiresPro: true,
    accessReason: 'paywall_gated',
    bannerTitlePl: 'Wymaga licencji PRO',
    bannerTitleEn: 'Requires PRO Access',
  };
}

export interface TrialProgressInfo {
  percentUsed: number;
  percentRemaining: number;
  isExpiringSoon: boolean;
  daysRemaining: number;
  brewsRemaining: number;
}

/**
 * Zwraca informacje o postępie i procentowym zużyciu limitów okresu próbnego (czas oraz liczba zaparzonych kaw).
 */
export function getTrialProgressInfo(state?: AppAccessState | null): TrialProgressInfo {
  const current = state && typeof state === 'object' && 'status' in state ? state : getAppAccessState();

  if (current.isSubscribed) {
    return {
      percentUsed: 0,
      percentRemaining: 100,
      isExpiringSoon: false,
      daysRemaining: Infinity,
      brewsRemaining: Infinity,
    };
  }

  if (current.status === 'trial_expired') {
    return {
      percentUsed: 100,
      percentRemaining: 0,
      isExpiringSoon: true,
      daysRemaining: 0,
      brewsRemaining: 0,
    };
  }

  const safeDaysRemaining =
    Number.isFinite(current.daysRemaining) && current.daysRemaining >= 0
      ? Math.min(TRIAL_DURATION_DAYS, current.daysRemaining)
      : 0;
  const safeBrewsRemaining =
    Number.isFinite(current.brewsRemaining) && current.brewsRemaining >= 0
      ? Math.min(TRIAL_MAX_BREWS, current.brewsRemaining)
      : 0;

  const daysUsed = Math.max(0, TRIAL_DURATION_DAYS - safeDaysRemaining);
  const brewsUsed = Math.max(0, TRIAL_MAX_BREWS - safeBrewsRemaining);

  const daysPercentUsed = (daysUsed / TRIAL_DURATION_DAYS) * 100;
  const brewsPercentUsed = (brewsUsed / TRIAL_MAX_BREWS) * 100;

  const rawPercentUsed = Math.max(daysPercentUsed, brewsPercentUsed);
  const percentUsed = Number(Math.max(0, Math.min(100, rawPercentUsed)).toFixed(1));
  const percentRemaining = Number((100 - percentUsed).toFixed(1));

  const isExpiringSoon = safeDaysRemaining <= 3 || safeBrewsRemaining <= 3;

  return {
    percentUsed,
    percentRemaining,
    isExpiringSoon,
    daysRemaining: safeDaysRemaining,
    brewsRemaining: safeBrewsRemaining,
  };
}



export interface PaywallCallToAction {
  titlePl: string;
  titleEn: string;
  subtitlePl: string;
  subtitleEn: string;
  buttonTextPl: string;
  buttonTextEn: string;
  urgency: 'low' | 'medium' | 'high';
  recommendedTier: 'monthly' | 'annual' | 'lifetime';
}

/**
 * Zwraca zoptymalizowaną treść wezwania do działania (CTA) w paywallu oraz poziom pilności (urgency)
 * w zależności od aktualnego stanu subskrypcji lub etapu okresu próbnego.
 */
export function getPaywallCallToAction(state?: AppAccessState | null): PaywallCallToAction {
  const current = state && typeof state === 'object' && 'status' in state ? state : getAppAccessState();

  if (current.isSubscribed) {
    return {
      titlePl: 'Subskrypcja aktywna',
      titleEn: 'Subscription Active',
      subtitlePl: 'Wszystkie funkcje profesjonalne i bazy wiedzy są w pełni odblokowane.',
      subtitleEn: 'All pro tools and craft knowledge bases are fully unlocked.',
      buttonTextPl: 'Zarządzaj subskrypcją',
      buttonTextEn: 'Manage Subscription',
      urgency: 'low',
      recommendedTier: current.subscriptionTier === 'monthly' || current.subscriptionTier === 'lifetime'
        ? current.subscriptionTier
        : 'annual',
    };
  }

  if (current.status === 'trial_expired') {
    return {
      titlePl: 'Okres próbny zakończony',
      titleEn: 'Free Trial Expired',
      subtitlePl: 'Odblokuj nieograniczone parzenia, asystenta BPR oraz pełną bazę sensoryczną.',
      subtitleEn: 'Unlock unlimited brewing, BPR engine, and full sensory compendium.',
      buttonTextPl: 'Odblokuj Napar Pro',
      buttonTextEn: 'Unlock Napar Pro',
      urgency: 'high',
      recommendedTier: 'annual',
    };
  }

  const daysRem = Number.isFinite(current.daysRemaining) ? current.daysRemaining : TRIAL_DURATION_DAYS;
  const brewsRem = Number.isFinite(current.brewsRemaining) ? current.brewsRemaining : TRIAL_MAX_BREWS;

  if (daysRem <= 3 || brewsRem <= 3) {
    return {
      titlePl: 'Twój okres próbny wkrótce się kończy',
      titleEn: 'Your Free Trial Is Ending Soon',
      subtitlePl: `Pozostało Ci ${daysRem} dni lub ${brewsRem} parzeń. Wybierz plan roczny z 2 miesiącami gratis.`,
      subtitleEn: `You have ${daysRem} days or ${brewsRem} brews left. Choose the annual plan to save with 2 months free.`,
      buttonTextPl: 'Przejdź na Pro',
      buttonTextEn: 'Upgrade to Pro',
      urgency: 'medium',
      recommendedTier: 'annual',
    };
  }

  return {
    titlePl: 'Odkryj pełnię możliwości Napar Pro',
    titleEn: 'Experience the Full Power of Napar Pro',
    subtitlePl: 'Przetestuj zaawansowane profile mielenia, dial-in espresso i estymację kofeiny.',
    subtitleEn: 'Explore advanced grind profiling, espresso dial-in, and caffeine curve tracking.',
    buttonTextPl: 'Rozpocznij subskrypcję',
    buttonTextEn: 'Start Subscription',
    urgency: 'low',
    recommendedTier: 'annual',
  };
}


export interface SubscriptionDiscountInfo {
  discountPercent: number;
  discountFormatted: string;
  savedAmount: number;
  savingsLabelPl: string;
  savingsLabelEn: string;
  hasDiscount: boolean;
}

/**
 * Oblicza procentowy rabat i kwotę oszczędności pomiędzy ceną bazową (np. 12x subskrypcja miesięczna)
 * a ceną promocyjną lub roczną, formatując zlokalizowane etykiety dla widoku paywalla.
 */
export function formatSubscriptionDiscount(
  basePrice: number | string | undefined | null,
  discountedPrice: number | string | undefined | null,
  currencySymbol = 'zł'
): SubscriptionDiscountInfo {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(/[^\d.,-]/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const base = parseVal(basePrice);
  const discounted = parseVal(discountedPrice);

  if (base <= 0 || discounted >= base) {
    return {
      discountPercent: 0,
      discountFormatted: '0%',
      savedAmount: 0,
      savingsLabelPl: 'Brak rabatu',
      savingsLabelEn: 'No discount',
      hasDiscount: false,
    };
  }

  const rawDiff = base - discounted;
  const savedAmount = Number(rawDiff.toFixed(2));
  const rawPct = Math.round((rawDiff / base) * 100);
  const discountPercent = Math.min(100, Math.max(1, rawPct));
  const discountFormatted = `-${discountPercent}%`;

  const sym = typeof currencySymbol === 'string' && currencySymbol.trim() ? currencySymbol.trim() : 'zł';
  const savedPl = savedAmount.toFixed(2).replace('.', ',');
  const savedEn = savedAmount.toFixed(2);

  const savingsLabelPl = `Oszczędzasz ${savedPl} ${sym} (${discountFormatted})`;
  const savingsLabelEn = `Save ${savedEn} ${sym} (${discountPercent}% off)`;

  return {
    discountPercent,
    discountFormatted,
    savedAmount,
    savingsLabelPl,
    savingsLabelEn,
    hasDiscount: true,
  };
}

export interface SubscriptionSavingsAnalysis {
  tier: 'annual' | 'lifetime';
  yearlyCostMonthlyBilling: number;
  tierCost: number;
  savedAmountPln: number;
  savingsPercent: number;
  breakEvenMonths: number;
  badgeLabelPl: string;
  badgeLabelEn: string;
}

/**
 * Szacuje korzyści finansowe i oszczędności przy wyborze planu rocznego lub dożywotniego
 * w odniesieniu do rozliczenia miesięcznego (12x cena miesięczna).
 */
export function calculateSubscriptionSavings(
  tier: 'annual' | 'lifetime' | string,
  monthlyPricePln: number | string = 19.99,
  tierPricePln?: number | string
): SubscriptionSavingsAnalysis {
  const parseNum = (v: unknown, fallback: number): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) && v > 0 ? v : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) && parsed > 0 ? parsed : fallback;
    }
    return fallback;
  };

  const isLifetime = typeof tier === 'string' && tier.trim().toLowerCase() === 'lifetime';
  const resolvedTier: 'annual' | 'lifetime' = isLifetime ? 'lifetime' : 'annual';

  const monthly = parseNum(monthlyPricePln, 19.99);
  const defaultTierCost = resolvedTier === 'lifetime' ? 299.99 : 149.99;
  const cost = parseNum(tierPricePln, defaultTierCost);

  const yearlyMonthlyBilling = Number((monthly * 12).toFixed(2));
  const breakEven = Number((cost / monthly).toFixed(1));

  let savedAmountPln: number;
  let savingsPercent: number;
  let badgeLabelPl: string;
  let badgeLabelEn: string;

  if (resolvedTier === 'annual') {
    const rawSaved = Math.max(0, yearlyMonthlyBilling - cost);
    savedAmountPln = Number(rawSaved.toFixed(2));
    savingsPercent = yearlyMonthlyBilling > 0 ? Math.round((savedAmountPln / yearlyMonthlyBilling) * 100) : 0;
    badgeLabelPl = `Oszczędzasz ${savingsPercent}% (${savedAmountPln.toFixed(2)} zł / rok)`;
    badgeLabelEn = `Save ${savingsPercent}% (${savedAmountPln.toFixed(2)} zł / yr)`;
  } else {
    // Lifetime
    const rawSaved = Math.max(0, yearlyMonthlyBilling * 2 - cost);
    savedAmountPln = Number(rawSaved.toFixed(2));
    savingsPercent = Math.round((1 - cost / (yearlyMonthlyBilling * 2)) * 100);
    badgeLabelPl = `Jednorazowy zakup — zwrot po ${breakEven} mies.`;
    badgeLabelEn = `One-time purchase — pays off in ${breakEven} mos.`;
  }

  return {
    tier: resolvedTier,
    yearlyCostMonthlyBilling: yearlyMonthlyBilling,
    tierCost: cost,
    savedAmountPln,
    savingsPercent: Math.max(0, savingsPercent),
    breakEvenMonths: breakEven,
    badgeLabelPl,
    badgeLabelEn,
  };
}

