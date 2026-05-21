import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  INTERSTITIAL_COOLDOWN_MS,
  INTERSTITIAL_MIN_CALCULATIONS,
  isInterstitialEligible,
  loadInterstitialPolicyState,
  markInterstitialShown,
  recordInterstitialCalculation,
  resetInterstitialPolicy,
} from '@/ads/interstitialPolicy';

describe('interstitialPolicy', () => {
  beforeEach(() => {
    resetInterstitialPolicy();
  });

  test('requires several calculations before showing', () => {
    for (let count = 1; count < INTERSTITIAL_MIN_CALCULATIONS; count += 1) {
      const state = recordInterstitialCalculation();
      expect(isInterstitialEligible(state)).toBe(false);
    }

    const eligibleState = recordInterstitialCalculation();
    expect(eligibleState.calculationsSinceLastInterstitial).toBe(INTERSTITIAL_MIN_CALCULATIONS);
    expect(isInterstitialEligible(eligibleState)).toBe(true);
  });

  test('resets the counter and applies a cooldown after showing', () => {
    for (let count = 0; count < INTERSTITIAL_MIN_CALCULATIONS; count += 1) {
      recordInterstitialCalculation();
    }

    const shownAt = 1_700_000_000_000;
    const shownState = markInterstitialShown(shownAt);
    expect(shownState.calculationsSinceLastInterstitial).toBe(0);
    expect(shownState.lastShownAt).toBe(shownAt);
    expect(loadInterstitialPolicyState()).toEqual(shownState);

    for (let count = 0; count < INTERSTITIAL_MIN_CALCULATIONS; count += 1) {
      recordInterstitialCalculation();
    }

    const cooldownState = loadInterstitialPolicyState();
    expect(isInterstitialEligible(cooldownState, shownAt + INTERSTITIAL_COOLDOWN_MS - 1)).toBe(false);
    expect(isInterstitialEligible(cooldownState, shownAt + INTERSTITIAL_COOLDOWN_MS)).toBe(true);
  });
});
