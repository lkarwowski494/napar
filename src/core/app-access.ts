// ============================================================================
// Napar (Steepwise) — App Access & Monetization Engine ("Cheaper than Espresso")
// Zero feature-gating during trial (100% features available).
// After trial expiration: Creation blocked + Read-Only History guaranteed.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { useState } from 'react';
import { getAppSetting, setAppSetting } from './database';

export const TRIAL_MAX_BREWS = 3;
export const TRIAL_DURATION_DAYS = 7;

export const STORE_PRODUCT_IDS = {
  monthly: 'pl.lukasz.napar.monthly',
  annual: 'pl.lukasz.napar.annual',
  lifetime: 'pl.lukasz.napar.lifetime',
} as const;

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

export function getAppAccessState(): AppAccessState {
  const isPro = getAppSetting('is_pro_active', 'false') === 'true';
  const tier = (getAppSetting('subscription_tier', isPro ? 'lifetime' : 'none') as any) || 'none';

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
  const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - elapsedDays);

  const brewsCount = parseInt(getAppSetting('trial_brews_count', '0'), 10) || 0;
  const brewsRemaining = Math.max(0, TRIAL_MAX_BREWS - brewsCount);

  const isExpired = brewsCount >= TRIAL_MAX_BREWS || elapsedDays >= TRIAL_DURATION_DAYS;

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
  return getAppAccessState();
}

export function activateSubscription(tier: 'monthly' | 'annual' | 'lifetime'): AppAccessState {
  setAppSetting('is_pro_active', 'true');
  setAppSetting('subscription_tier', tier);
  setAppSetting('has_verified_purchase', 'true');
  setAppSetting('verified_purchase_tier', tier);
  return getAppAccessState();
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
    return { ...state, restored: true };
  }

  // Brak legalnego dowodu zakupu — nie rozdajemy darmowego Lifetime
  const state = getAppAccessState();
  return { ...state, restored: false };
}

export function resetTrialForTesting(): void {
  setAppSetting('is_pro_active', 'false');
  setAppSetting('subscription_tier', 'none');
  setAppSetting('has_verified_purchase', 'false');
  setAppSetting('verified_purchase_tier', '');
  setAppSetting('trial_brews_count', '0');
  setAppSetting('trial_started_at', new Date().toISOString());
}

export function setTrialExpiredForTesting(): void {
  setAppSetting('is_pro_active', 'false');
  setAppSetting('subscription_tier', 'none');
  setAppSetting('trial_brews_count', String(TRIAL_MAX_BREWS));
}

export function useAppAccess() {
  const [access, setAccess] = useState<AppAccessState>(() => getAppAccessState());

  const refresh = () => {
    setAccess(getAppAccessState());
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
    restore,
    recordBrew,
  };
}
