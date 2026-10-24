// ============================================================================
// Apps4Craft Studio — Unit Tests: OnboardingModal (Ritual Personalization)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { OnboardingModal } from '../OnboardingModal';
import { LanguageProvider } from '../../core/i18n';

describe('OnboardingModal Component', () => {
  it('renders onboarding modal with 3 preference options and welcome copy', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <LanguageProvider>
          <OnboardingModal visible={true} onComplete={jest.fn()} />
        </LanguageProvider>
      );
    });

    const root = tree.root;
    const str = JSON.stringify(tree.toJSON());

    expect(str).toContain('Witaj w Naparze');
    expect(str).toContain('Tylko Kawa Specialty');
    expect(str).toContain('Tylko Herbata Rzemieślnicza');
    expect(str).toContain('Kawa i Herbata');

    const coffeeCard = root.findByProps({ testID: 'onboarding-pref-coffee' });
    const teaCard = root.findByProps({ testID: 'onboarding-pref-tea' });
    const bothCard = root.findByProps({ testID: 'onboarding-pref-both' });
    const submitBtn = root.findByProps({ testID: 'onboarding-submit-btn' });

    expect(coffeeCard).toBeTruthy();
    expect(teaCard).toBeTruthy();
    expect(bothCard).toBeTruthy();
    expect(submitBtn).toBeTruthy();
  });

  it('selects coffee only and completes onboarding with "coffee"', async () => {
    const mockComplete = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <LanguageProvider>
          <OnboardingModal visible={true} onComplete={mockComplete} />
        </LanguageProvider>
      );
    });

    const root = tree.root;
    const coffeeCard = root.findByProps({ testID: 'onboarding-pref-coffee' });
    const submitBtn = root.findByProps({ testID: 'onboarding-submit-btn' });

    await act(async () => {
      coffeeCard.props.onPress();
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockComplete).toHaveBeenCalledWith('coffee');
  });

  it('selects tea only and completes onboarding with "tea"', async () => {
    const mockComplete = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <LanguageProvider>
          <OnboardingModal visible={true} onComplete={mockComplete} />
        </LanguageProvider>
      );
    });

    const root = tree.root;
    const teaCard = root.findByProps({ testID: 'onboarding-pref-tea' });
    const submitBtn = root.findByProps({ testID: 'onboarding-submit-btn' });

    await act(async () => {
      teaCard.props.onPress();
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockComplete).toHaveBeenCalledWith('tea');
  });

  it('selects both and completes onboarding with "both"', async () => {
    const mockComplete = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <LanguageProvider>
          <OnboardingModal visible={true} onComplete={mockComplete} />
        </LanguageProvider>
      );
    });

    const root = tree.root;
    const bothCard = root.findByProps({ testID: 'onboarding-pref-both' });
    const submitBtn = root.findByProps({ testID: 'onboarding-submit-btn' });

    await act(async () => {
      bothCard.props.onPress();
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockComplete).toHaveBeenCalledWith('both');
  });
});
