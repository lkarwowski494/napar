// ============================================================================
// Napar (Steepwise) — Unit Tests: identyfikatory produktów i plany
// ============================================================================

import { ALL_STORE_PRODUCT_IDS, STORE_PRODUCT_IDS, isSubscriptionPlan, planForProductId } from '../store-products';
import type { ProPlan } from '../access-policy';

describe('identyfikatory produktów Apple', () => {
  test('zgodne z NaparStoreKit.storekit (subskrypcje w grupie, dożywotni non-consumable)', () => {
    expect(STORE_PRODUCT_IDS).toEqual({
      monthly: 'pl.lukasz.napar.monthly',
      yearly: 'pl.lukasz.napar.annual',
      lifetime: 'pl.lukasz.napar.lifetime',
    });
  });

  test('lista wszystkich produktów zawiera trzy identyfikatory', () => {
    expect(ALL_STORE_PRODUCT_IDS).toHaveLength(3);
    expect(ALL_STORE_PRODUCT_IDS).toEqual(expect.arrayContaining(Object.values(STORE_PRODUCT_IDS)));
  });
});

describe('planForProductId i isSubscriptionPlan', () => {
  test('każdy identyfikator ma plan', () => {
    expect(planForProductId(STORE_PRODUCT_IDS.monthly)).toBe('monthly');
    expect(planForProductId(STORE_PRODUCT_IDS.yearly)).toBe('yearly');
    expect(planForProductId(STORE_PRODUCT_IDS.lifetime)).toBe('lifetime');
  });

  test('obcy identyfikator i nazwa z prototypu nie są planem', () => {
    expect(planForProductId('com.obcy.produkt')).toBeNull();
    expect(planForProductId('constructor')).toBeNull();
  });

  test('subskrypcje to plany miesięczny i roczny; dożywotni nie jest subskrypcją', () => {
    const plans: ProPlan[] = ['monthly', 'yearly', 'lifetime'];
    expect(plans.map(isSubscriptionPlan)).toEqual([true, true, false]);
  });
});
