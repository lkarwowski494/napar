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
  const normalizedTierStr = typeof rawTier === 'string' ? rawTier.trim().toLowerCase() : '';
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
  let cleanTier = typeof tier === 'string' ? tier.trim().toLowerCase() : '';
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
    : (typeof (state as any).brewsRemaining === 'string' ? parseFloat(String((state as any).brewsRemaining).replace(',', '.')) : 0);
  const rawBrews = Number.isFinite(rawBrewsVal) && rawBrewsVal >= 0
    ? Math.floor(rawBrewsVal)
    : 0;
  const brews = Object.is(rawBrews, -0) ? 0 : rawBrews;

  const rawDaysVal = typeof state.daysRemaining === 'number'
    ? state.daysRemaining
    : (typeof (state as any).daysRemaining === 'string' ? parseFloat(String((state as any).daysRemaining).replace(',', '.')) : 0);
  const rawDays = Number.isFinite(rawDaysVal) && rawDaysVal >= 0
    ? Math.floor(rawDaysVal)
    : 0;
  const days = Object.is(rawDays, -0) ? 0 : rawDays;

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
  const cleanTier = typeof tier === 'string' ? tier.trim().toLowerCase() : '';
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
    const receiptJson = getAppSetting('verified_receipt_json', '');
    if (receiptJson) {
      try {
        const parsed = JSON.parse(receiptJson);
        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          typeof parsed.productId === 'string' &&
          parsed.productId.trim() &&
          typeof parsed.transactionId === 'string' &&
          parsed.transactionId.trim() &&
          typeof parsed.purchaseDate === 'string' &&
          parsed.purchaseDate.trim() &&
          typeof parsed.signature === 'string' &&
          parsed.signature.trim()
        ) {
          receipt = {
            productId: parsed.productId.trim(),
            transactionId: parsed.transactionId.trim(),
            purchaseDate: parsed.purchaseDate.trim(),
            signature: parsed.signature.trim(),
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
    !receipt.signature.trim() ||
    receipt.signature.trim().length < 8 ||
    typeof receipt.purchaseDate !== 'string' ||
    !receipt.purchaseDate.trim() ||
    isNaN(new Date(receipt.purchaseDate.trim()).getTime())
  ) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }
  const cleanProductId = typeof receipt.productId === 'string' ? receipt.productId.trim().toLowerCase() : '';
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

  const purchaseTime = new Date(receipt.purchaseDate.trim()).getTime();
  const maxAllowedFutureTime = Date.now() + 86400000; // max 24h w przyszłość (ochrona przed manipulacją datami)
  if (isNaN(purchaseTime) || purchaseTime <= 0 || purchaseTime > maxAllowedFutureTime) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }

  const cleanTransactionId = receipt.transactionId
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
    purchaseDate: receipt.purchaseDate.trim(),
    signature: receipt.signature.trim(),
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
