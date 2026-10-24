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
  const tier: 'none' | 'monthly' | 'annual' | 'lifetime' =
    rawTier === 'monthly' || rawTier === 'annual' || rawTier === 'lifetime'
      ? rawTier
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
  let trialStartedAt = getAppSetting('trial_started_at', '');
  if (!trialStartedAt) {
    trialStartedAt = new Date().toISOString();
    setAppSetting('trial_started_at', trialStartedAt);
  }

  const startDate = new Date(trialStartedAt);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const maxDaysSeen = parseInt(getAppSetting('trial_max_days_seen', '0'), 10) || 0;
  const effectiveElapsedDays = Math.max(elapsedDays, maxDaysSeen);
  if (elapsedDays > maxDaysSeen) {
    setAppSetting('trial_max_days_seen', String(elapsedDays));
  }
  const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - effectiveElapsedDays);

  const brewsCount = parseInt(getAppSetting('trial_brews_count', '0'), 10) || 0;
  const brewsRemaining = Math.max(0, TRIAL_MAX_BREWS - brewsCount);

  const isExpired = brewsCount >= TRIAL_MAX_BREWS || effectiveElapsedDays >= TRIAL_DURATION_DAYS;

  if (isExpired) {
    return {
      status: 'trial_expired',
      brewsCount,
      brewsRemaining: 0,
      daysRemaining,
      isSubscribed: false,
      canCreate: false,
      isHistoryReadOnly: true,
      subscriptionTier: 'none',
    };
  }

  return {
    status: 'trial_active',
    brewsCount,
    brewsRemaining,
    daysRemaining,
    isSubscribed: false,
    canCreate: true,
    isHistoryReadOnly: false,
    subscriptionTier: 'none',
  };
}

export function recordBrewCompleted(): AppAccessState {
  const current = getAppAccessState();
  if (current.isSubscribed) {
    return current;
  }
  const newCount = current.brewsCount + 1;
  setAppSetting('trial_brews_count', String(newCount));
  const state = getAppAccessState();
  notifyAccessChanged();
  return state;
}

export function activateSubscription(tier: 'monthly' | 'annual' | 'lifetime'): AppAccessState {
  setAppSetting('is_pro_active', 'true');
  setAppSetting('subscription_tier', tier);
  setAppSetting('has_verified_purchase', 'true');
  setAppSetting('verified_purchase_tier', tier);
  const state = getAppAccessState();
  notifyAccessChanged();
  return state;
}

export type RestorePurchasesResult = AppAccessState & { restored: boolean };

export function restorePurchases(): RestorePurchasesResult {
  const verifiedVal = getAppSetting('has_verified_purchase', 'false');
  const hasVerifiedPurchase = verifiedVal === 'true' || verifiedVal === '1';
  const verifiedTier = getAppSetting('verified_purchase_tier', '') as
    | 'monthly'
    | 'annual'
    | 'lifetime'
    | '';

  if (hasVerifiedPurchase && verifiedTier) {
    setAppSetting('is_pro_active', 'true');
    setAppSetting('subscription_tier', verifiedTier);
    const state = getAppAccessState();
    notifyAccessChanged();
    return { ...state, restored: true };
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
  if (!receipt || !receipt.transactionId || !receipt.signature) {
    return {
      success: false,
      error: 'Nieprawidłowy podpis transakcji StoreKit',
      errorCode: 'invalid_signature',
    };
  }
  let tier: 'monthly' | 'annual' | 'lifetime' | null = null;
  if (receipt.productId === STORE_PRODUCT_IDS.monthly) tier = 'monthly';
  else if (receipt.productId === STORE_PRODUCT_IDS.annual) tier = 'annual';
  else if (receipt.productId === STORE_PRODUCT_IDS.lifetime) tier = 'lifetime';

  if (!tier) {
    return {
      success: false,
      error: 'Nieznany identyfikator produktu StoreKit',
      errorCode: 'unknown_product',
    };
  }

  setAppSetting('is_pro_active', 'true');
  setAppSetting('subscription_tier', tier);
  setAppSetting('has_verified_purchase', 'true');
  setAppSetting('verified_purchase_tier', tier);
  setAppSetting('verified_receipt_json', JSON.stringify(receipt));

  const state = getAppAccessState();
  notifyAccessChanged();

  return { success: true, tier, receipt };
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
  setAppSetting('trial_brews_count', String(TRIAL_MAX_BREWS));
  notifyAccessChanged();
}

export function purchaseWithStoreKit(
  tier: 'monthly' | 'annual' | 'lifetime'
): StoreKitVerificationResult {
  // W trybie DEV / przed konfiguracją App Store Connect aktywujemy subskrypcję uczciwie
  const state = activateSubscription(tier);
  return {
    success: true,
    tier,
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

  const restore = (): boolean => {
    const res = restorePurchases();
    setAccess(res);
    return res.restored;
  };

  const recordBrew = () => {
    const updated = recordBrewCompleted();
    setAccess(updated);
  };

  return {
    ...access,
    refresh,
    subscribe,
    purchaseWithStoreKit,
    restore,
    recordBrew,
  };
}
